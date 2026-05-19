# NeighborGoods – Implementation Plan

## Vision
A community barter/trade app where kids can exchange books, toys, board games, bikes, etc.
within neighborhoods using digital tokens as a fair exchange medium.

## Stack
- **Frontend**: React (CRA) + TypeScript
- **Backend**: FastAPI (Python) + JSON flat-file storage
- **Auth**: Phone number + 4-digit PIN
- **Storage**: JSON flat files, persisted on Azure `/home` mount
- **Deployment**: Azure Static Web Apps (frontend) + Azure App Service (backend)
- **CI/CD**: GitHub Actions

## Folder Structure (target)
```
NeighborGoods/
├── backend/
│   ├── app/main.py          # All FastAPI routes
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── theme.ts         # Amber/warm color system
│   │   └── components/
│   │       ├── AuthFlow.tsx
│   │       ├── AppHeader.tsx
│   │       ├── CommunitiesTab.tsx
│   │       ├── ItemsTab.tsx
│   │       ├── TradesTab.tsx
│   │       ├── SuperAdminPanel.tsx
│   │       └── TapSortList.tsx
│   ├── package.json
│   └── tsconfig.json
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml
│       └── deploy-frontend.yml
├── start.sh          # Dev: start backend + frontend
├── stop.sh
├── restart.sh
└── .gitignore
```

## Domain Models
| Entity      | Storage path              | Key fields |
|-------------|---------------------------|------------|
| User        | `data/users/{id}.json`        | phone, pin, tokenBalance (starts 100), communityIds |
| Community   | `data/communities/{id}.json`  | name, memberIds, adminId, inviteCode (6-char) |
| Item        | `data/items/{id}.json`        | communityId, userId, title, category, tokenValue, status |
| Interest    | `data/interests/{id}.json`    | userId, itemId (express interest = want this item) |
| Trade       | `data/trades/{id}.json`       | type (2way/3way/4way), participants, itemChain, status |

## Features & Progress

### Phase 1 – Scaffold
- [x] Monorepo setup (start/stop/restart scripts)
- [ ] React + FastAPI + JSON stack
- [ ] Python venv + requirements.txt

### Phase 2 – Auth & Data Layer
- [ ] Phone + PIN auth (login / signup → 100 token welcome bonus)
- [ ] JSON flat-file storage helpers
- [ ] Azure persistent storage config

### Phase 3 – UI Shell
- [ ] Amber/warm theme (`theme.ts`)
- [ ] Sticky header + tab bar shell
- [ ] Mobile-friendly item lists (tap + arrow-key sorting)
- [ ] Share links via hash routing (`#community=ID`)

### Phase 4 – Core Features
- [ ] Communities: create, join (via 6-char invite code), browse
- [ ] Items: add by category (books 📚 toys 🧸 games 🎲 bikes 🚲 other 📦)
- [ ] Google Books search when adding book items
- [ ] Digital tokens: item values, user balance display
- [ ] Interest / Wishlist: "I Want This!" per item
- [ ] Trade matching: 2-way / 3-way / 4-way cycle detection algorithm

### Phase 5 – Admin & Deploy
- [ ] Super admin panel (communities, users, data browser, config)
- [ ] Azure SWA + App Service deployment config
- [ ] GitHub Actions CI/CD (backend + frontend separate workflows)

## Key Design Decisions
- **Auth**: Stateless phone+PIN (no JWT/sessions)
- **Tokens**: Each item has a token value; users start with 100 tokens
- **Trades**: DFS cycle detection on "who wants what from whom" graph
- **Single instance**: Flat-file storage requires 1 App Service worker (scale-out: 1)
- **Google Books**: Graceful fallback to mock data if API key not set

## Azure Resources (to provision)
```bash
az group create --name neighborgoods-rg --location eastus
az appservice plan create --name neighborgoods-plan --resource-group neighborgoods-rg --sku B1 --is-linux
az webapp create --name neighborgoods-backend --resource-group neighborgoods-rg --plan neighborgoods-plan --runtime "PYTHON:3.11"
az staticwebapp create --name neighborgoods-frontend --resource-group neighborgoods-rg --location eastus2 --sku Free
az webapp config appsettings set --name neighborgoods-backend --resource-group neighborgoods-rg \
  --settings DATA_DIR=/home/data SUPER_ADMIN_PHONES="your_phone" GOOGLE_BOOKS_API_KEY="your_key"
```

## GitHub Secrets Required
| Secret | Source |
|--------|--------|
| `AZURE_CLIENT_ID` | App Registration → Application ID |
| `AZURE_TENANT_ID` | Azure AD → Overview → Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Subscriptions → your subscription |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | SWA resource → Deployment Token |

## Project Drivers
- **S** → Siddarth Akula
- **V** → Vihaan Pendyala
- **R** → Riskhik Polusani
