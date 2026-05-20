from __future__ import annotations

from fastapi import FastAPI, Query, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from dotenv import load_dotenv
import json, os, random, string
from datetime import datetime
import httpx

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_raw = os.environ.get('DATA_DIR', '../data')
DATA_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, _raw))

USERS_DIR       = os.path.join(DATA_DIR, "users")
COMMUNITIES_DIR = os.path.join(DATA_DIR, "communities")
ITEMS_DIR       = os.path.join(DATA_DIR, "items")
INTERESTS_DIR   = os.path.join(DATA_DIR, "interests")
TRADES_DIR      = os.path.join(DATA_DIR, "trades")

for d in [USERS_DIR, COMMUNITIES_DIR, ITEMS_DIR, INTERESTS_DIR, TRADES_DIR]:
    os.makedirs(d, exist_ok=True)

SUPER_ADMIN_PHONES = set(
    p.strip() for p in os.environ.get("SUPER_ADMIN_PHONES", "").split(",") if p.strip()
)


def normalize_phone(phone: str) -> str:
    return ''.join(ch for ch in str(phone or '') if ch.isdigit())


def is_super_admin(phone: str) -> bool:
    clean = normalize_phone(phone)
    return clean in {normalize_phone(p) for p in SUPER_ADMIN_PHONES}


def make_id() -> str:
    return datetime.now().strftime('%Y%m%d%H%M%S%f')[:18]


def now_iso() -> str:
    return datetime.now().isoformat(timespec='seconds')


# Users
def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


def _load_all_from(directory: str) -> list:
    if not os.path.exists(directory):
        return []
    rows = []
    for fn in sorted(os.listdir(directory)):
        if fn.endswith('.json'):
            rows.append(load_json(os.path.join(directory, fn)))
    return rows


def _entity_path(directory: str, entity_id: str) -> str:
    return os.path.join(directory, f'{entity_id}.json')


def get_all_users() -> list:
    return _load_all_from(USERS_DIR)


def get_user_by_id(uid: str) -> dict | None:
    path = _entity_path(USERS_DIR, uid)
    if os.path.exists(path):
        return load_json(path)
    for user in get_all_users():
        if user.get('id') == uid:
            return user
    return None


def get_user_by_phone(phone: str) -> dict | None:
    clean = normalize_phone(phone)
    for user in get_all_users():
        if normalize_phone(user.get('phone', '')) == clean:
            return user
    return None


def save_user(user: dict):
    save_json(_entity_path(USERS_DIR, user['id']), user)


# Communities
def get_all_communities() -> list:
    return _load_all_from(COMMUNITIES_DIR)


def get_community(cid: str) -> dict | None:
    path = _entity_path(COMMUNITIES_DIR, cid)
    if os.path.exists(path):
        return load_json(path)
    for community in get_all_communities():
        if community.get('id') == cid:
            return community
    return None


def save_community(c: dict):
    save_json(_entity_path(COMMUNITIES_DIR, c['id']), c)


# Items
def get_all_items() -> list:
    return _load_all_from(ITEMS_DIR)


def get_item(iid: str) -> dict | None:
    path = _entity_path(ITEMS_DIR, iid)
    if os.path.exists(path):
        return load_json(path)
    for item in get_all_items():
        if item.get('id') == iid:
            return item
    return None


def save_item(item: dict):
    save_json(_entity_path(ITEMS_DIR, item['id']), item)


def delete_item_file(iid: str):
    path = _entity_path(ITEMS_DIR, iid)
    if os.path.exists(path):
        os.remove(path)


# Interests
def get_all_interests() -> list:
    return _load_all_from(INTERESTS_DIR)


def save_interest(i: dict):
    save_json(_entity_path(INTERESTS_DIR, i['id']), i)


def delete_interest_file(iid: str):
    path = _entity_path(INTERESTS_DIR, iid)
    if os.path.exists(path):
        os.remove(path)


# Trades
def get_all_trades() -> list:
    return _load_all_from(TRADES_DIR)


def get_trade(tid: str) -> dict | None:
    path = _entity_path(TRADES_DIR, tid)
    if os.path.exists(path):
        return load_json(path)
    for trade in get_all_trades():
        if trade.get('id') == tid:
            return trade
    return None


def save_trade(t: dict):
    save_json(_entity_path(TRADES_DIR, t['id']), t)


def delete_trade_file(tid: str):
    path = _entity_path(TRADES_DIR, tid)
    if os.path.exists(path):
        os.remove(path)


def sanitize_user(user: dict | None) -> dict | None:
    if not user:
        return None
    clean = dict(user)
    clean.pop('pin', None)
    clean['isSuperAdmin'] = bool(user.get('isSuperAdmin') or is_super_admin(user.get('phone', '')))
    return clean


def require_user(phone: str) -> dict:
    user = get_user_by_phone(phone)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user


def require_super_admin(phone: str) -> dict:
    user = require_user(phone)
    if not sanitize_user(user).get('isSuperAdmin'):
        raise HTTPException(status_code=403, detail='Super admin only')
    return user


def require_community_member(phone: str, community_id: str) -> tuple[dict, dict]:
    user = require_user(phone)
    community = get_community(community_id)
    if not community:
        raise HTTPException(status_code=404, detail='Community not found')
    if user['id'] not in community.get('memberIds', []) and not sanitize_user(user).get('isSuperAdmin'):
        raise HTTPException(status_code=403, detail='You are not a member of this community')
    return user, community


def generate_invite_code() -> str:
    existing = {c.get('inviteCode') for c in get_all_communities()}
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if code not in existing:
            return code


def enrich_item(item: dict, current_user_id: Optional[str] = None) -> dict:
    interests = [i for i in get_all_interests() if i.get('itemId') == item['id']]
    owner = get_user_by_id(item.get('userId', ''))
    return {
        **item,
        'interestCount': len(interests),
        'myInterest': any(i.get('userId') == current_user_id for i in interests),
        'myInterestId': next((i['id'] for i in interests if i.get('userId') == current_user_id), None),
        'ownerName': f"{owner.get('firstName', '')} {owner.get('lastName', '')}".strip() if owner else 'Unknown',
    }


def enrich_trade(trade: dict) -> dict:
    users = {u['id']: u for u in get_all_users()}
    items = {i['id']: i for i in get_all_items()}
    return {
        **trade,
        'participantNames': [
            f"{users[uid].get('firstName', '')} {users[uid].get('lastName', '')}".strip() if uid in users else uid
            for uid in trade.get('participants', [])
        ],
        'itemTitles': [items[iid].get('title', iid) if iid in items else iid for iid in trade.get('itemChain', [])],
    }


def delete_user_file(uid: str):
    path = _entity_path(USERS_DIR, uid)
    if os.path.exists(path):
        os.remove(path)


def delete_community_file(cid: str):
    path = _entity_path(COMMUNITIES_DIR, cid)
    if os.path.exists(path):
        os.remove(path)


def safe_admin_path(path: str = '') -> tuple[str, str]:
    rel = os.path.normpath((path or '').lstrip('/')) if path else '.'
    if rel.startswith('..'):
        raise HTTPException(status_code=400, detail='Invalid path')
    abs_path = os.path.abspath(os.path.join(DATA_DIR, rel))
    if abs_path != DATA_DIR and not abs_path.startswith(DATA_DIR + os.sep):
        raise HTTPException(status_code=400, detail='Invalid path')
    return rel, abs_path


@app.post('/api/check-phone')
def check_phone(data: dict = Body(...)):
    phone = normalize_phone(data.get('phone', '').strip())
    user = get_user_by_phone(phone)
    return {'exists': user is not None}


@app.post('/api/login')
def login(data: dict = Body(...)):
    user = get_user_by_phone(data.get('phone', ''))
    if not user or user.get('pin') != str(data.get('pin', '')):
        return {'success': False, 'message': 'Invalid phone or PIN'}
    return {'success': True, 'user': sanitize_user(user)}


@app.post('/api/signup')
def signup(data: dict = Body(...)):
    phone = normalize_phone(data.get('phone', '').strip())
    if not phone:
        return {'success': False, 'message': 'Phone is required'}
    if get_user_by_phone(phone):
        return {'success': False, 'message': 'Phone already registered'}
    pin = str(data.get('pin', '')).strip()
    if len(pin) != 4 or not pin.isdigit():
        return {'success': False, 'message': 'PIN must be 4 digits'}
    user = {
        'id': make_id(),
        'phone': phone,
        'firstName': data.get('firstName', '').strip(),
        'lastName': data.get('lastName', '').strip(),
        'email': (data.get('email') or '').strip() or None,
        'pin': pin,
        'tokenBalance': 100,
        'communityIds': [],
        'isSuperAdmin': is_super_admin(phone),
        'createdAt': now_iso(),
    }
    if not user['firstName'] or not user['lastName']:
        return {'success': False, 'message': 'First and last name are required'}
    save_user(user)
    return {'success': True, 'user': sanitize_user(user)}


@app.get('/api/communities')
def list_my_communities(phone: str = Query(...)):
    user = get_user_by_phone(phone)
    if not user:
        return []
    mine = [c for c in get_all_communities() if user['id'] in c.get('memberIds', [])]
    return sorted(mine, key=lambda c: c.get('createdAt', ''), reverse=True)


@app.get('/api/communities/all')
def list_all_communities(phone: str = Query(...)):
    require_user(phone)
    return sorted(get_all_communities(), key=lambda c: c.get('createdAt', ''), reverse=True)


@app.post('/api/communities')
def create_community(data: dict = Body(...)):
    user = require_user(data.get('phone', ''))
    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip()
    if not name:
        raise HTTPException(status_code=400, detail='Name is required')
    community = {
        'id': make_id(),
        'name': name,
        'description': description,
        'memberIds': [user['id']],
        'adminId': user['id'],
        'inviteCode': generate_invite_code(),
        'createdAt': now_iso(),
    }
    save_community(community)
    user['communityIds'] = sorted(set(user.get('communityIds', []) + [community['id']]))
    save_user(user)
    return {'success': True, 'community': community, 'user': sanitize_user(user)}


@app.post('/api/communities/join')
def join_community(data: dict = Body(...)):
    user = require_user(data.get('phone', ''))
    invite_code = (data.get('inviteCode') or '').strip().upper()
    community = next((c for c in get_all_communities() if c.get('inviteCode', '').upper() == invite_code), None)
    if not community:
        return {'success': False, 'message': 'Invite code not found'}
    if user['id'] not in community.get('memberIds', []):
        community['memberIds'] = sorted(set(community.get('memberIds', []) + [user['id']]))
        save_community(community)
    if community['id'] not in user.get('communityIds', []):
        user['communityIds'] = sorted(set(user.get('communityIds', []) + [community['id']]))
        save_user(user)
    return {'success': True, 'community': community, 'user': sanitize_user(user)}


@app.get('/api/communities/{community_id}')
def get_community_details(community_id: str):
    community = get_community(community_id)
    if not community:
        raise HTTPException(status_code=404, detail='Community not found')
    return community


@app.get('/api/items')
def list_items(communityId: str = Query(...), phone: str = Query(...)):
    user, _ = require_community_member(phone, communityId)
    items = [enrich_item(i, user['id']) for i in get_all_items() if i.get('communityId') == communityId]
    items.sort(key=lambda i: i.get('createdAt', ''), reverse=True)
    return items


@app.post('/api/items')
def create_item(data: dict = Body(...)):
    user, community = require_community_member(data.get('phone', ''), data.get('communityId', ''))
    title = (data.get('title') or '').strip()
    if not title:
        raise HTTPException(status_code=400, detail='Title is required')
    item = {
        'id': make_id(),
        'communityId': community['id'],
        'userId': user['id'],
        'title': title,
        'description': (data.get('description') or '').strip(),
        'category': data.get('category') or 'other',
        'tokenValue': int(data.get('tokenValue') or 0),
        'imageUrl': (data.get('imageUrl') or '').strip() or None,
        'googleBookId': (data.get('googleBookId') or '').strip() or None,
        'status': 'available',
        'createdAt': now_iso(),
    }
    save_item(item)
    return {'success': True, 'item': enrich_item(item, user['id'])}


@app.patch('/api/items/{item_id}')
def update_item(item_id: str, data: dict = Body(...)):
    user = require_user(data.get('phone', ''))
    item = get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail='Item not found')
    if item.get('userId') != user['id'] and not sanitize_user(user).get('isSuperAdmin'):
        raise HTTPException(status_code=403, detail='Not allowed')
    status = (data.get('status') or '').strip()
    if status not in {'available', 'reserved', 'traded'}:
        raise HTTPException(status_code=400, detail='Invalid status')
    item['status'] = status
    save_item(item)
    return {'success': True, 'item': enrich_item(item, user['id'])}


@app.delete('/api/items/{item_id}')
def remove_item(item_id: str, phone: str = Query(...)):
    user = require_user(phone)
    item = get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail='Item not found')
    if item.get('userId') != user['id'] and not sanitize_user(user).get('isSuperAdmin'):
        raise HTTPException(status_code=403, detail='Not allowed')
    for interest in get_all_interests():
        if interest.get('itemId') == item_id:
            delete_interest_file(interest['id'])
    delete_item_file(item_id)
    return {'success': True}


@app.post('/api/interests')
def create_interest(data: dict = Body(...)):
    user = require_user(data.get('phone', ''))
    item = get_item(data.get('itemId', ''))
    if not item:
        raise HTTPException(status_code=404, detail='Item not found')
    if item.get('status') != 'available':
        raise HTTPException(status_code=400, detail='Item is not available')
    if item.get('userId') == user['id']:
        raise HTTPException(status_code=400, detail='You cannot interest your own item')
    require_community_member(user['phone'], item['communityId'])
    existing = next((i for i in get_all_interests() if i.get('itemId') == item['id'] and i.get('userId') == user['id']), None)
    if existing:
        return {'success': True, 'interest': existing}
    interest = {
        'id': make_id(),
        'userId': user['id'],
        'itemId': item['id'],
        'communityId': item['communityId'],
        'createdAt': now_iso(),
    }
    save_interest(interest)
    return {'success': True, 'interest': interest}


@app.delete('/api/interests/{interest_id}')
def remove_interest(interest_id: str, phone: str = Query(...)):
    user = require_user(phone)
    interest = next((i for i in get_all_interests() if i.get('id') == interest_id), None)
    if not interest:
        raise HTTPException(status_code=404, detail='Interest not found')
    if interest.get('userId') != user['id'] and not sanitize_user(user).get('isSuperAdmin'):
        raise HTTPException(status_code=403, detail='Not allowed')
    delete_interest_file(interest_id)
    return {'success': True}


@app.get('/api/interests/my')
def my_interests(phone: str = Query(...)):
    user = require_user(phone)
    my_interest_rows = [i for i in get_all_interests() if i.get('userId') == user['id']]
    results = []
    for interest in my_interest_rows:
        item = get_item(interest.get('itemId', ''))
        if item:
            community = get_community(item.get('communityId', ''))
            results.append({
                **enrich_item(item, user['id']),
                'myInterestId': interest['id'],
                'communityName': community.get('name') if community else None,
            })
    return results


@app.get('/api/trades/matches')
def trade_matches(communityId: str = Query(...), phone: str = Query(...)):
    _, community = require_community_member(phone, communityId)
    available_items = [i for i in get_all_items() if i.get('communityId') == community['id'] and i.get('status') == 'available']
    item_map = {i['id']: i for i in available_items}
    users = {u['id']: u for u in get_all_users()}
    edge_item: dict[tuple[str, str], str] = {}
    adjacency: dict[str, set[str]] = {}

    for interest in get_all_interests():
        if interest.get('communityId') != community['id']:
            continue
        item = item_map.get(interest.get('itemId'))
        interest_user = users.get(interest.get('userId'))
        if not item or not interest_user:
            continue
        owner_id = item.get('userId')
        seeker_id = interest_user['id']
        if seeker_id == owner_id:
            continue
        adjacency.setdefault(seeker_id, set()).add(owner_id)
        edge_item.setdefault((seeker_id, owner_id), item['id'])

    seen: set[tuple[str, ...]] = set()
    results = []

    def normalize_cycle(cycle: list[str]) -> tuple[str, ...]:
        rotations = [tuple(cycle[i:] + cycle[:i]) for i in range(len(cycle))]
        return min(rotations)

    def add_cycle(cycle: list[str]):
        key = normalize_cycle(cycle)
        if key in seen or len(results) >= 20:
            return
        item_chain = []
        item_titles = []
        valid = True
        for idx, uid in enumerate(cycle):
            next_uid = cycle[(idx + 1) % len(cycle)]
            item_id = edge_item.get((uid, next_uid))
            item = item_map.get(item_id or '')
            if not item:
                valid = False
                break
            item_chain.append(item_id)
            item_titles.append(item.get('title', item_id))
        if not valid or len(set(cycle)) != len(cycle):
            return
        seen.add(key)
        results.append({
            'type': f'{len(cycle)}way',
            'participants': cycle,
            'participantNames': [
                f"{users[uid].get('firstName', '')} {users[uid].get('lastName', '')}".strip() if uid in users else uid
                for uid in cycle
            ],
            'itemChain': item_chain,
            'itemTitles': item_titles,
        })

    def dfs(start: str, current: str, path: list[str], visited: set[str]):
        if len(path) > 4 or len(results) >= 20:
            return
        for nxt in sorted(adjacency.get(current, [])):
            if nxt == start and 2 <= len(path) <= 4:
                add_cycle(path[:])
            elif nxt not in visited and len(path) < 4:
                visited.add(nxt)
                path.append(nxt)
                dfs(start, nxt, path, visited)
                path.pop()
                visited.remove(nxt)

    for start in sorted(adjacency.keys()):
        dfs(start, start, [start], {start})
        if len(results) >= 20:
            break

    return results


@app.post('/api/trades')
def create_trade(data: dict = Body(...)):
    user = require_user(data.get('phone', ''))
    participant_ids = data.get('participantIds') or []
    item_chain = data.get('itemChain') or []
    trade_type = data.get('type') or f'{len(participant_ids)}way'
    if user['id'] not in participant_ids:
        raise HTTPException(status_code=403, detail='You must be part of the trade')
    if trade_type not in {'2way', '3way', '4way'}:
        raise HTTPException(status_code=400, detail='Invalid trade type')
    if len(participant_ids) != len(set(participant_ids)):
        raise HTTPException(status_code=400, detail='Participants must be unique')
    items = [get_item(iid) for iid in item_chain]
    if not all(items):
        raise HTTPException(status_code=400, detail='All trade items must exist')
    trade = {
        'id': make_id(),
        'type': trade_type,
        'participants': participant_ids,
        'itemChain': item_chain,
        'communityId': items[0].get('communityId') if items else None,
        'status': 'proposed',
        'createdAt': now_iso(),
    }
    save_trade(trade)
    return {'success': True, 'trade': enrich_trade(trade)}


@app.patch('/api/trades/{trade_id}')
def update_trade(trade_id: str, data: dict = Body(...)):
    user = require_user(data.get('phone', ''))
    trade = get_trade(trade_id)
    if not trade:
        raise HTTPException(status_code=404, detail='Trade not found')
    if user['id'] not in trade.get('participants', []) and not sanitize_user(user).get('isSuperAdmin'):
        raise HTTPException(status_code=403, detail='Not allowed')
    status = (data.get('status') or '').strip()
    if status not in {'proposed', 'accepted', 'declined', 'completed', 'cancelled'}:
        raise HTTPException(status_code=400, detail='Invalid status')
    trade['status'] = status
    save_trade(trade)
    return {'success': True, 'trade': enrich_trade(trade)}


@app.get('/api/trades')
def list_my_trades(phone: str = Query(...)):
    user = require_user(phone)
    trades = [enrich_trade(t) for t in get_all_trades() if user['id'] in t.get('participants', [])]
    trades.sort(key=lambda t: t.get('createdAt', ''), reverse=True)
    return trades


@app.get('/api/search/books')
async def search_books(q: str = Query(...)):
    query = (q or '').strip()
    if not query:
        return []
    api_key = os.environ.get('GOOGLE_BOOKS_API_KEY', '').strip()
    if not api_key:
        return [
            {
                'id': 'mock-book-1',
                'title': f'{query} Adventures',
                'authors': ['Demo Author'],
                'imageUrl': 'https://placehold.co/128x192?text=Book',
                'description': 'Mock Google Books result for local development.',
            },
            {
                'id': 'mock-book-2',
                'title': f'The {query} Club',
                'authors': ['Sample Writer'],
                'imageUrl': 'https://placehold.co/128x192?text=Story',
                'description': 'Another mock result so the UI works without an API key.',
            },
            {
                'id': 'mock-book-3',
                'title': f'Learning {query}',
                'authors': ['Practice Press'],
                'imageUrl': 'https://placehold.co/128x192?text=Read',
                'description': 'Use GOOGLE_BOOKS_API_KEY to fetch real Google Books results.',
            },
        ]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                'https://www.googleapis.com/books/v1/volumes',
                params={'q': query, 'key': api_key, 'maxResults': 5},
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return []

    results = []
    for item in payload.get('items', []):
        info = item.get('volumeInfo', {})
        image_links = info.get('imageLinks', {})
        results.append({
            'id': item.get('id'),
            'title': info.get('title', 'Untitled'),
            'authors': info.get('authors', []),
            'imageUrl': image_links.get('thumbnail') or image_links.get('smallThumbnail'),
            'description': info.get('description', ''),
        })
    return results


@app.get('/api/users/all')
def list_all_users_admin(phone: str = Query(...)):
    require_super_admin(phone)
    users = [sanitize_user(u) for u in get_all_users()]
    users.sort(key=lambda u: (u.get('firstName', ''), u.get('lastName', '')))
    return users


@app.post('/api/admin/login-as')
def admin_login_as(data: dict = Body(...)):
    require_super_admin(data.get('phone', ''))
    target = get_user_by_phone(data.get('targetPhone', ''))
    if not target:
        raise HTTPException(status_code=404, detail='Target user not found')
    return {'success': True, 'user': sanitize_user(target)}


@app.delete('/api/admin/users/{user_id}')
def admin_delete_user(user_id: str, phone: str = Query(...)):
    require_super_admin(phone)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    for community in get_all_communities():
        if user_id in community.get('memberIds', []):
            community['memberIds'] = [uid for uid in community.get('memberIds', []) if uid != user_id]
            save_community(community)

    for item in list(get_all_items()):
        if item.get('userId') == user_id:
            for interest in list(get_all_interests()):
                if interest.get('itemId') == item['id']:
                    delete_interest_file(interest['id'])
            delete_item_file(item['id'])

    for interest in list(get_all_interests()):
        if interest.get('userId') == user_id:
            delete_interest_file(interest['id'])

    for trade in list(get_all_trades()):
        if user_id in trade.get('participants', []):
            delete_trade_file(trade['id'])

    delete_user_file(user_id)
    return {'success': True}


@app.delete('/api/admin/communities/{community_id}')
def admin_delete_community(community_id: str, phone: str = Query(...)):
    require_super_admin(phone)
    community = get_community(community_id)
    if not community:
        raise HTTPException(status_code=404, detail='Community not found')

    for user in get_all_users():
        if community_id in user.get('communityIds', []):
            user['communityIds'] = [cid for cid in user.get('communityIds', []) if cid != community_id]
            save_user(user)

    item_ids = [item['id'] for item in get_all_items() if item.get('communityId') == community_id]
    for item_id in item_ids:
        delete_item_file(item_id)
    for interest in list(get_all_interests()):
        if interest.get('communityId') == community_id or interest.get('itemId') in item_ids:
            delete_interest_file(interest['id'])
    for trade in list(get_all_trades()):
        if trade.get('communityId') == community_id:
            delete_trade_file(trade['id'])

    delete_community_file(community_id)
    return {'success': True}


@app.get('/api/admin/data/browse')
def admin_browse_data(phone: str = Query(...), path: str = Query(default='')):
    require_super_admin(phone)
    rel, abs_path = safe_admin_path(path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail='Path not found')
    if not os.path.isdir(abs_path):
        raise HTTPException(status_code=400, detail='Path is not a directory')
    entries = []
    for name in sorted(os.listdir(abs_path)):
        child = os.path.join(abs_path, name)
        stat = os.stat(child)
        child_rel = name if rel == '.' else os.path.join(rel, name)
        entries.append({
            'name': name,
            'isDir': os.path.isdir(child),
            'size': stat.st_size,
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(timespec='seconds'),
            'path': child_rel.replace('\\', '/'),
        })
    return {'path': '' if rel == '.' else rel.replace('\\', '/'), 'entries': entries, 'dataDir': DATA_DIR}


@app.get('/api/admin/data/file')
def admin_read_file(phone: str = Query(...), path: str = Query(...)):
    require_super_admin(phone)
    rel, abs_path = safe_admin_path(path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail='File not found')
    if os.path.isdir(abs_path):
        raise HTTPException(status_code=400, detail='Path is a directory')
    with open(abs_path, 'r', encoding='utf-8') as f:
        return {'path': rel.replace('\\', '/'), 'content': f.read()}


@app.get('/api/admin/config')
def admin_config(phone: str = Query(...)):
    require_super_admin(phone)
    return {
        'dataDir': DATA_DIR,
        'config': {
            'DATA_DIR': os.environ.get('DATA_DIR', '../data'),
            'SUPER_ADMIN_PHONES': os.environ.get('SUPER_ADMIN_PHONES', ''),
            'GOOGLE_BOOKS_API_KEY_SET': bool(os.environ.get('GOOGLE_BOOKS_API_KEY')),
            'BACKEND_DIR': _BACKEND_DIR,
        },
    }


@app.get('/api/health')
def health():
    return {
        'status': 'ok',
        'dataDir': DATA_DIR,
        'exists': os.path.exists(DATA_DIR),
        'counts': {
            'users': len(get_all_users()),
            'communities': len(get_all_communities()),
            'items': len(get_all_items()),
        },
    }
