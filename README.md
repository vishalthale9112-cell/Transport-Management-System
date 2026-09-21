# THALE TRANSPORT — Multi-Tenant Fleet Management

FastAPI + SQLAlchemy backend and React + Vite frontend for vehicles, drivers,
orders, trips, GPS, fuel, maintenance, finance, reports, documents,
notifications and the AI assistant.

## Company data isolation

The application is a multi-tenant SaaS:

- Supabase Auth handles email/password login and access tokens.
- Every business row has a server-controlled `company_id`.
- SQLAlchemy automatically filters every private query by the logged-in user's
  verified company membership.
- New rows are automatically stamped with that company and cross-company
  writes/deletes are rejected.
- The browser cannot choose an arbitrary company: `X-Company-ID` is accepted
  only after membership is verified.
- Document files are served only through the authenticated download endpoint.
- Driver GPS updates remain public only through a long, random tracking token.

On the first deployment, existing data is moved into the
`THALE TRANSPORT` workspace. Set `INITIAL_OWNER_EMAIL` before opening
registration so only that email can claim the existing workspace. Every later
new account receives a separate company workspace.

## Environment variables

Copy the example files and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

For Render, set the backend variables from `backend/.env.example`. For Vercel,
set the frontend variables from `frontend/.env.example`.

Supabase projects using asymmetric JWT signing need `SUPABASE_URL`. Legacy
HS256 projects also need `SUPABASE_JWT_SECRET`. Never put the JWT secret or a
Supabase service-role key in the frontend.

## Run locally

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API docs are at `http://localhost:8000/docs`.

## Deployment migration

The backend runs an idempotent startup migration that creates `companies` and
`company_members`, adds `company_id` to all tenant-owned tables, moves old rows
to `THALE TRANSPORT`, and adds company indexes. Back up the production database
before the first deployment, as with any schema migration.
