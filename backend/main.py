from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

import models
import schemas

from database import engine, get_db, Base


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Thale Transport API",
    version="0.1.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Thale Transport API running"
    }


# =========================================================
# DASHBOARD
# =========================================================

@app.get(
    "/api/dashboard",
    response_model=schemas.DashboardStats
)
def get_dashboard(
    db: Session = Depends(get_db)
):

    total_vehicles = (
        db.query(models.Vehicle)
        .count()
    )

    active_trips = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle.trip_progress > 0,
            models.Vehicle.trip_progress < 100
        )
        .count()
    )

    total_drivers = (
        db.query(models.Driver)
        .count()
    )

    pending_orders = (
        db.query(models.Order)
        .filter(
            models.Order.status.in_(
                ["Pending", "New"]
            )
        )
        .count()
    )

    finance_rows = (
        db.query(models.MonthlyFinance)
        .all()
    )

    fuel_counts = {}

    for vehicle in (
        db.query(models.Vehicle).all()
    ):
        fuel_counts[
            vehicle.fuel_type
        ] = (
            fuel_counts.get(
                vehicle.fuel_type,
                0
            )
            + 1
        )

    vehicles = (
        db.query(models.Vehicle)
        .limit(6)
        .all()
    )

    cost_per_km = {
        vehicle.registration_number:
            round(
                8 + (vehicle.id * 1.3),
                1
            )
        for vehicle in vehicles
    }

    alerts = (
        db.query(models.Alert)
        .order_by(
            models.Alert.id.desc()
        )
        .all()
    )

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


# =========================================================
# VEHICLES
# =========================================================

@app.get(
    "/api/vehicles",
    response_model=list[schemas.VehicleOut]
)
def list_vehicles(
    search: str = "",
    db: Session = Depends(get_db)
):

    query = db.query(
        models.Vehicle
    )

    if search:
        query = query.filter(
            models.Vehicle
            .registration_number
            .ilike(
                f"%{search}%"
            )
        )

    return query.all()


@app.get(
    "/api/vehicles/{vehicle_id}",
    response_model=schemas.VehicleOut
)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    vehicle = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle.id
            == vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return vehicle


@app.post(
    "/api/vehicles",
    response_model=schemas.VehicleOut
)
def create_vehicle(
    vehicle: schemas.VehicleCreate,
    db: Session = Depends(get_db)
):

    existing = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle
            .registration_number
            == vehicle.registration_number
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already exists"
        )

    new_vehicle = models.Vehicle(
        **vehicle.model_dump()
    )

    db.add(new_vehicle)

    db.commit()

    db.refresh(new_vehicle)

    return new_vehicle


@app.delete(
    "/api/vehicles/{vehicle_id}"
)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    vehicle = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle.id
            == vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    db.delete(vehicle)

    db.commit()

    return {
        "ok": True,
        "message": "Vehicle deleted"
    }


# =========================================================
# DRIVERS
# =========================================================

@app.get(
    "/api/drivers",
    response_model=list[schemas.DriverOut]
)
def list_drivers(
    db: Session = Depends(get_db)
):

    return (
        db.query(models.Driver)
        .all()
    )


@app.post(
    "/api/drivers",
    response_model=schemas.DriverOut
)
def create_driver(
    driver: schemas.DriverCreate,
    db: Session = Depends(get_db)
):

    new_driver = models.Driver(
        **driver.model_dump()
    )

    db.add(new_driver)

    db.commit()

    db.refresh(new_driver)

    return new_driver


@app.delete(
    "/api/drivers/{driver_id}"
)
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db)
):

    driver = (
        db.query(models.Driver)
        .filter(
            models.Driver.id
            == driver_id
        )
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    db.delete(driver)

    db.commit()

    return {
        "ok": True,
        "message": "Driver deleted"
    }


# =========================================================
# ORDERS
# =========================================================

@app.get(
    "/api/orders",
    response_model=list[schemas.OrderOut]
)
def list_orders(
    db: Session = Depends(get_db)
):

    return (
        db.query(models.Order)
        .order_by(
            models.Order.id.desc()
        )
        .all()
    )


@app.post(
    "/api/orders",
    response_model=schemas.OrderOut
)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db)
):

    from datetime import date

    new_order = models.Order(
        **order.model_dump(),
        created_at=date.today()
    )

    db.add(new_order)

    db.commit()

    db.refresh(new_order)

    return new_order
@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"ok": True, "message": "Order deleted"}


# =========================================================
# TRIPS
# =========================================================

@app.get(
    "/api/trips",
    response_model=list[schemas.TripOut]
)
def list_trips(
    db: Session = Depends(get_db)
):

    trips = (
        db.query(models.Trip)
        .order_by(
            models.Trip.id.desc()
        )
        .all()
    )

    return trips


@app.get(
    "/api/trips/{trip_id}",
    response_model=schemas.TripOut
)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(models.Trip)
        .filter(
            models.Trip.id
            == trip_id
        )
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    return trip


@app.post(
    "/api/trips",
    response_model=schemas.TripOut,
    status_code=201
)
def create_trip(
    trip: schemas.TripCreate,
    db: Session = Depends(get_db)
):

    # Check vehicle
    vehicle = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle.id
            == trip.vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Check origin
    if not trip.origin.strip():
        raise HTTPException(
            status_code=400,
            detail="Origin is required"
        )

    # Check destination
    if not trip.destination.strip():
        raise HTTPException(
            status_code=400,
            detail="Destination is required"
        )

    # Prevent same origin/destination
    if (
        trip.origin.strip().lower()
        ==
        trip.destination.strip().lower()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Origin and destination "
                "cannot be same"
            )
        )

    new_trip = models.Trip(
        vehicle_id=trip.vehicle_id,
        origin=trip.origin.strip(),
        destination=trip.destination.strip(),
        progress=trip.progress,
        status=trip.status,
    )

    db.add(new_trip)

    db.commit()

    db.refresh(new_trip)

    return new_trip


@app.delete(
    "/api/trips/{trip_id}"
)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(models.Trip)
        .filter(
            models.Trip.id
            == trip_id
        )
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    db.delete(trip)

    db.commit()

    return {
        "ok": True,
        "message": "Trip deleted successfully"
    }

# =========================================================
# FUEL LOGS
# =========================================================

@app.get(
    "/api/fuel-logs",
    response_model=list[schemas.FuelLogOut]
)
def list_fuel_logs(
    vehicle_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.FuelLog)

    if vehicle_id is not None:
        query = query.filter(
            models.FuelLog.vehicle_id == vehicle_id
        )

    return query.order_by(models.FuelLog.id.desc()).all()


@app.post(
    "/api/fuel-logs",
    response_model=schemas.FuelLogOut,
    status_code=201
)
def create_fuel_log(
    fuel: schemas.FuelLogCreate,
    db: Session = Depends(get_db)
):
    vehicle = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == fuel.vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    if fuel.liters <= 0:
        raise HTTPException(
            status_code=400,
            detail="Liters must be greater than 0"
        )

    if fuel.price_per_liter <= 0:
        raise HTTPException(
            status_code=400,
            detail="Price per liter must be greater than 0"
        )

    total_cost = round(
        fuel.liters * fuel.price_per_liter,
        2
    )

    new_fuel_log = models.FuelLog(
        vehicle_id=fuel.vehicle_id,
        fuel_type=fuel.fuel_type.strip() or "Diesel",
        liters=fuel.liters,
        price_per_liter=fuel.price_per_liter,
        total_cost=total_cost,
        odometer=fuel.odometer,
        station_name=(
            fuel.station_name.strip()
            if fuel.station_name
            else ""
        ),
        date=fuel.date
    )

    db.add(new_fuel_log)
    db.commit()
    db.refresh(new_fuel_log)

    return new_fuel_log


@app.delete("/api/fuel-logs/{fuel_log_id}")
def delete_fuel_log(
    fuel_log_id: int,
    db: Session = Depends(get_db)
):
    fuel_log = (
        db.query(models.FuelLog)
        .filter(models.FuelLog.id == fuel_log_id)
        .first()
    )

    if not fuel_log:
        raise HTTPException(
            status_code=404,
            detail="Fuel record not found"
        )

    db.delete(fuel_log)
    db.commit()

    return {
        "ok": True,
        "message": "Fuel record deleted successfully"
    }


# =========================================================
# ALERTS
# =========================================================

@app.get(
    "/api/alerts",
    response_model=list[schemas.AlertOut]
)
def list_alerts(
    db: Session = Depends(get_db)
):

    return (
        db.query(models.Alert)
        .order_by(
            models.Alert.id.desc()
        )
        .all()
    )
@app.get("/api/maintenance", response_model=list[schemas.MaintenanceRecordOut])
def list_maintenance(vehicle_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.MaintenanceRecord)
    if vehicle_id is not None:
        query = query.filter(models.MaintenanceRecord.vehicle_id == vehicle_id)
    return query.order_by(models.MaintenanceRecord.id.desc()).all()


@app.post("/api/maintenance", response_model=schemas.MaintenanceRecordOut, status_code=201)
def create_maintenance(record: schemas.MaintenanceRecordCreate, db: Session = Depends(get_db)):
    from datetime import date as date_type

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == record.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    new_record = models.MaintenanceRecord(
        **record.model_dump(),
        date=date_type.today(),
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@app.delete("/api/maintenance/{record_id}")
def delete_maintenance(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.MaintenanceRecord).filter(models.MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    db.delete(record)
    db.commit()
    return {"ok": True, "message": "Maintenance record deleted"}