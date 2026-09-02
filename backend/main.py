from datetime import date, datetime

from fastapi import FastAPI, Depends, HTTPException, Query
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
    "/api/dashboard"
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

    return {
        "total_vehicles": total_vehicles,
        "active_trips": active_trips,
        "total_drivers": total_drivers,
        "pending_orders": pending_orders,
        "monthly_finance": finance_rows,
        "fuel_breakdown": fuel_counts,
        "cost_per_km": cost_per_km,
        "alerts": alerts,
    }


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

    # Every new vehicle automatically gets a secure GPS link token.
    tracker = models.VehicleGpsTracker(
        vehicle_id=new_vehicle.id,
    )

    db.add(tracker)
    db.commit()

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

    # Remove GPS history and tracker before deleting the vehicle.
    (
        db.query(models.VehicleLocation)
        .filter(models.VehicleLocation.vehicle_id == vehicle_id)
        .delete(synchronize_session=False)
    )

    (
        db.query(models.VehicleGpsTracker)
        .filter(models.VehicleGpsTracker.vehicle_id == vehicle_id)
        .delete(synchronize_session=False)
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

    order_data = order.model_dump()

    if not order_data.get("created_at"):
        order_data["created_at"] = date.today()

    new_order = models.Order(**order_data)

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
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == record.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    record_data = record.model_dump()

    if not record_data.get("date"):
        record_data["date"] = date.today()

    new_record = models.MaintenanceRecord(**record_data)
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


# =========================================================
# REAL VEHICLE GPS TRACKING
# =========================================================

GPS_ONLINE_SECONDS = 30


def get_required_vehicle(
    vehicle_id: int,
    db: Session,
):
    vehicle = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return vehicle


def gps_status_from_time(recorded_at):
    if not recorded_at:
        return "Offline"

    age_seconds = (
        datetime.utcnow() - recorded_at
    ).total_seconds()

    return (
        "Online"
        if age_seconds <= GPS_ONLINE_SECONDS
        else "Offline"
    )


@app.post(
    "/api/gps/tracker/{vehicle_id}",
    response_model=schemas.GpsTrackerOut,
)
def create_or_get_gps_tracker(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    vehicle = get_required_vehicle(vehicle_id, db)

    tracker = (
        db.query(models.VehicleGpsTracker)
        .filter(
            models.VehicleGpsTracker.vehicle_id
            == vehicle_id
        )
        .first()
    )

    if not tracker:
        tracker = models.VehicleGpsTracker(
            vehicle_id=vehicle_id,
        )
        db.add(tracker)
    else:
        tracker.is_active = True

    db.commit()
    db.refresh(tracker)

    return {
        "vehicle_id": vehicle.id,
        "registration_number": vehicle.registration_number,
        "tracking_token": tracker.tracking_token,
        "is_active": tracker.is_active,
        "driver_tracking_path": (
            f"/driver-track/{tracker.tracking_token}"
        ),
    }


@app.get(
    "/api/gps/tracker/{vehicle_id}",
    response_model=schemas.GpsTrackerOut,
)
def get_gps_tracker(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    return create_or_get_gps_tracker(
        vehicle_id=vehicle_id,
        db=db,
    )


@app.post("/api/gps/update/{tracking_token}")
def receive_driver_gps_location(
    tracking_token: str,
    location: schemas.GpsLocationUpdate,
    db: Session = Depends(get_db),
):
    tracker = (
        db.query(models.VehicleGpsTracker)
        .filter(
            models.VehicleGpsTracker.tracking_token
            == tracking_token
        )
        .first()
    )

    if not tracker:
        raise HTTPException(
            status_code=404,
            detail="Invalid GPS tracking link",
        )

    if not tracker.is_active:
        raise HTTPException(
            status_code=403,
            detail="GPS tracking is stopped",
        )

    vehicle = get_required_vehicle(
        tracker.vehicle_id,
        db,
    )

    now = datetime.utcnow()

    gps_location = models.VehicleLocation(
        vehicle_id=vehicle.id,
        latitude=location.latitude,
        longitude=location.longitude,
        accuracy=location.accuracy,
        speed=location.speed,
        heading=location.heading,
        recorded_at=now,
    )

    # Update the vehicle too, so the existing vehicle API and map
    # always receive the latest real coordinates.
    vehicle.latitude = location.latitude
    vehicle.longitude = location.longitude
    tracker.last_seen_at = now

    db.add(gps_location)
    db.commit()
    db.refresh(gps_location)

    return {
        "ok": True,
        "message": "Live GPS location updated",
        "vehicle_id": vehicle.id,
        "registration_number": vehicle.registration_number,
        "latitude": gps_location.latitude,
        "longitude": gps_location.longitude,
        "speed": gps_location.speed,
        "recorded_at": gps_location.recorded_at,
        "gps_status": "Online",
    }


@app.get(
    "/api/gps/latest",
    response_model=list[schemas.GpsLatestLocationOut],
)
def list_latest_gps_locations(
    db: Session = Depends(get_db),
):
    vehicles = db.query(models.Vehicle).all()
    result = []

    for vehicle in vehicles:
        latest = (
            db.query(models.VehicleLocation)
            .filter(
                models.VehicleLocation.vehicle_id
                == vehicle.id
            )
            .order_by(
                models.VehicleLocation.recorded_at.desc(),
                models.VehicleLocation.id.desc(),
            )
            .first()
        )

        if not latest:
            continue

        result.append({
            "vehicle_id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "latitude": latest.latitude,
            "longitude": latest.longitude,
            "accuracy": latest.accuracy,
            "speed": latest.speed,
            "heading": latest.heading,
            "recorded_at": latest.recorded_at,
            "gps_status": gps_status_from_time(
                latest.recorded_at
            ),
        })

    return result


@app.get(
    "/api/gps/latest/{vehicle_id}",
    response_model=schemas.GpsLatestLocationOut,
)
def get_latest_vehicle_gps(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    vehicle = get_required_vehicle(vehicle_id, db)

    latest = (
        db.query(models.VehicleLocation)
        .filter(
            models.VehicleLocation.vehicle_id
            == vehicle_id
        )
        .order_by(
            models.VehicleLocation.recorded_at.desc(),
            models.VehicleLocation.id.desc(),
        )
        .first()
    )

    if not latest:
        raise HTTPException(
            status_code=404,
            detail="GPS location not received yet",
        )

    return {
        "vehicle_id": vehicle.id,
        "registration_number": vehicle.registration_number,
        "latitude": latest.latitude,
        "longitude": latest.longitude,
        "accuracy": latest.accuracy,
        "speed": latest.speed,
        "heading": latest.heading,
        "recorded_at": latest.recorded_at,
        "gps_status": gps_status_from_time(
            latest.recorded_at
        ),
    }


@app.get("/api/gps/history/{vehicle_id}")
def get_vehicle_gps_history(
    vehicle_id: int,
    limit: int = Query(
        default=200,
        ge=1,
        le=1000,
    ),
    db: Session = Depends(get_db),
):
    vehicle = get_required_vehicle(vehicle_id, db)

    locations = (
        db.query(models.VehicleLocation)
        .filter(
            models.VehicleLocation.vehicle_id
            == vehicle_id
        )
        .order_by(
            models.VehicleLocation.recorded_at.desc()
        )
        .limit(limit)
        .all()
    )

    locations.reverse()

    return {
        "vehicle_id": vehicle.id,
        "registration_number": vehicle.registration_number,
        "locations": [
            {
                "latitude": item.latitude,
                "longitude": item.longitude,
                "accuracy": item.accuracy,
                "speed": item.speed,
                "heading": item.heading,
                "recorded_at": item.recorded_at,
            }
            for item in locations
        ],
    }


@app.post("/api/gps/stop/{tracking_token}")
def stop_driver_gps_tracking(
    tracking_token: str,
    db: Session = Depends(get_db),
):
    tracker = (
        db.query(models.VehicleGpsTracker)
        .filter(
            models.VehicleGpsTracker.tracking_token
            == tracking_token
        )
        .first()
    )

    if not tracker:
        raise HTTPException(
            status_code=404,
            detail="Invalid GPS tracking link",
        )

    tracker.is_active = False
    db.commit()

    return {
        "ok": True,
        "message": "GPS tracking stopped",
        "vehicle_id": tracker.vehicle_id,
    }
