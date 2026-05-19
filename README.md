# NeighborGoods

NeighborGoods is a full-stack barter trading app for neighborhood communities. Families can join invite-only groups, list books, toys, games, and bikes, express interest, and discover 2-way, 3-way, or 4-way trade cycles.

## Stack
- Frontend: React + TypeScript (CRA)
- Backend: FastAPI
- Storage: JSON flat-file per entity
- Auth: phone number + 4-digit PIN
- Theme: amber / warm inline-style system
- Deploy: Azure Static Web Apps + Azure App Service

## Local setup
### Backend
```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
cp .env.example .env
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
```

### Run both
```bash
./start.sh
```

Frontend: http://localhost:3030  
Backend: http://localhost:8080

## Key features
- Multi-step signup/login with phone + PIN
- Community create/join flows with invite codes
- Item listing, status updates, and interest tracking
- Google Books search with mock fallback in dev
- Trade-cycle discovery for 2-way, 3-way, and 4-way swaps
- Super admin tools for users, communities, data browser, and config
- GitHub Actions workflows for Azure deployment
