# Thale Transport — Fleet Management Dashboard

Python (FastAPI) backend + React (Vite) frontend, modeled on the Thale Transport dashboard screenshot.

## What's built
- **Dashboard**: monthly revenue vs expenses chart, fuel-type donut, cost-per-km bar chart, live alerts panel, and a stylized fleet map with vehicle markers (swap in Google Maps/Mapbox for real GPS tiles).
- **Vehicles**: searchable table, add/delete vehicles, driver + status + service-due info.
- All other sidebar sections (Drivers, Orders, Trips, Fuel, Maintenance, etc.) are scaffolded as placeholder routes — ready to build out next.
- Backend: FastAPI + SQLite, seeded with sample vehicles/drivers/orders/finance data.

## Run the backend
```bash
cd backend
pip install -r requirements.txt
python seed.py        # creates + seeds thale_transport.db (only needed once)
uvicorn main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

## Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Opens at http://localhost:5173 — make sure the backend is running on port 8000 first (see `src/api.js` for the base URL).

## Next steps you may want
- Build out the placeholder pages (Drivers, Orders, Trips, Maintenance, etc.) the same way Vehicles.jsx is built — call the existing/extend the API.
- Swap the stylized `FleetMap` component for a real map (Google Maps JS SDK or `react-leaflet` + Mapbox tiles) using each vehicle's `latitude`/`longitude`.
- Add auth (login screen, JWT) — currently the API is fully open.
- Wire the AI Assistant panel to an actual LLM call.
