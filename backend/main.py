from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import schemas
from database import engine, get_db, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Thale Transport API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Thale Transport API running"}


# ---------- Dashboard ----------
@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    total_vehicles = db.query(models.Vehicle).count()
    active_trips = db.query(models.Vehicle).filter(models.Vehicle.trip_progress > 0,
                                                     models.Vehicle.trip_progress < 100).count()
    total_drivers = db.query(models.Driver).count()
    pending_orders = db.query(models.Order).filter(models.Order.status.in_(["Pending", "New"])).count()

    finance_rows = db.query(models.MonthlyFinance).all()

    fuel_counts = {}
    for v in db.query(models.Vehicle).all():
        fuel_counts[v.fuel_type] = fuel_counts.get(v.fuel_type, 0) + 1

    vehicles = db.query(models.Vehicle).limit(6).all()
    cost_per_km = {v.registration_number: round(8 + (v.id * 1.3), 1) for v in vehicles}

    alerts = db.query(models.Alert).order_by(models.Alert.id.desc()).all()

    return schemas.DashboardStats(
        total_vehicles=total_vehicles,
        active_trips=active_trips,
        total_drivers=total_drivers,
        pending_orders=pending_orders,
        monthly_finance=finance_rows,
        fuel_breakdown=fuel_counts,
        cost_per_km=cost_per_km,
        alerts=alerts,
    )


# ---------- Vehicles ----------
@app.get("/api/vehicles", response_model=list[schemas.VehicleOut])
def list_vehicles(search: str = "", db: Session = Depends(get_db)):
    q = db.query(models.Vehicle)
    if search:
        q = q.filter(models.Vehicle.registration_number.ilike(f"%{search}%"))
    return q.all()


@app.get("/api/vehicles/{vehicle_id}", response_model=schemas.VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    v = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v


@app.post("/api/vehicles", response_model=schemas.VehicleOut)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Vehicle).filter(
        models.Vehicle.registration_number == vehicle.registration_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle already exists")
    v = models.Vehicle(**vehicle.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@app.delete("/api/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    v = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(v)
    db.commit()
    return {"ok": True}


# ---------- Drivers ----------
@app.get("/api/drivers", response_model=list[schemas.DriverOut])
def list_drivers(db: Session = Depends(get_db)):
    return db.query(models.Driver).all()


@app.post("/api/drivers", response_model=schemas.DriverOut)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db)):
    d = models.Driver(**driver.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@app.delete("/api/drivers/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    d = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(d)
    db.commit()
    return {"ok": True}


# ---------- Orders ----------
@app.get("/api/orders", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.id.desc()).all()


@app.post("/api/orders", response_model=schemas.OrderOut)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    from datetime import date
    o = models.Order(**order.model_dump(), created_at=date.today())
    db.add(o)
    db.commit()
    db.refresh(o)
    return o


# ---------- Alerts ----------
@app.get("/api/alerts", response_model=list[schemas.AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(models.Alert).order_by(models.Alert.id.desc()).all()
