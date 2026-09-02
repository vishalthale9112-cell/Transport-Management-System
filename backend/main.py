from datetime import date, datetime, timedelta
from math import atan2, cos, radians, sin, sqrt

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

import models
import schemas

from database import engine, get_db, Base
from sqlalchemy import inspect, text


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)

# =========================================================
# SAFE DATABASE MIGRATIONS
# =========================================================

def ensure_database_columns():
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    migrations = {
        "orders": {
            "customer_id": "INTEGER",
        },
        "customers": {
            "phone": "VARCHAR DEFAULT ''",
            "email": "VARCHAR DEFAULT ''",
            "company_name": "VARCHAR DEFAULT ''",
            "gst_number": "VARCHAR DEFAULT ''",
            "address": "VARCHAR DEFAULT ''",
            "city": "VARCHAR DEFAULT ''",
            "state": "VARCHAR DEFAULT 'Maharashtra'",
            "pincode": "VARCHAR DEFAULT ''",
            "status": "VARCHAR DEFAULT 'Active'",
            "total_orders": "INTEGER DEFAULT 0",
            "total_trips": "INTEGER DEFAULT 0",
            "total_revenue": "FLOAT DEFAULT 0",
            "paid_amount": "FLOAT DEFAULT 0",
            "pending_amount": "FLOAT DEFAULT 0",
        },
    }

    for table_name, required_columns in migrations.items():
        if table_name not in table_names:
            continue

        existing_columns = {
            column["name"]
            for column in inspector.get_columns(table_name)
        }

        for column_name, column_type in required_columns.items():
            if column_name in existing_columns:
                continue

            with engine.begin() as connection:
                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        f"ADD COLUMN {column_name} {column_type}"
                    )
                )


ensure_database_columns()


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
        .filter(models.Driver.id == driver_id)
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
    response_model=list[schemas.OrderOut],
)
def list_orders(
    customer_id: int | None = None,
    status: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(models.Order)

    if customer_id is not None:
        query = query.filter(
            models.Order.customer_id
            == customer_id
        )

    if status.strip():
        query = query.filter(
            models.Order.status
            == status.strip()
        )

    return (
        query
        .order_by(models.Order.id.desc())
        .all()
    )


@app.post(
    "/api/orders",
    response_model=schemas.OrderOut,
    status_code=201,
)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
):
    order_code = order.order_code.strip()

    if not order_code:
        raise HTTPException(
            status_code=400,
            detail="Order code is required",
        )

    existing_order = (
        db.query(models.Order)
        .filter(
            models.Order.order_code
            == order_code
        )
        .first()
    )

    if existing_order:
        raise HTTPException(
            status_code=400,
            detail="Order code already exists",
        )

    customer = None

    if order.customer_id is not None:
        customer = (
            db.query(models.Customer)
            .filter(
                models.Customer.id
                == order.customer_id
            )
            .first()
        )

    elif order.customer_name.strip():
        customer = (
            db.query(models.Customer)
            .filter(
                models.Customer.name
                == order.customer_name.strip()
            )
            .first()
        )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail=(
                "Customer not found. "
                "Please select a customer."
            ),
        )

    created_date = (
        order.created_at
        if order.created_at
        else date.today()
    )

    new_order = models.Order(
        order_code=order_code,
        customer_id=customer.id,
        customer_name=customer.name,
        status=(
            order.status.strip()
            or "Pending"
        ),
        amount=order.amount,
        created_at=created_date,
    )

    db.add(new_order)

    customer.total_orders = (
        int(customer.total_orders or 0)
        + 1
    )

    customer.total_revenue = (
        float(customer.total_revenue or 0)
        + float(order.amount or 0)
    )

    customer.pending_amount = max(
        float(customer.total_revenue or 0)
        - float(customer.paid_amount or 0),
        0,
    )

    db.commit()
    db.refresh(new_order)

    return new_order


@app.delete(
    "/api/orders/{order_id}"
)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = (
        db.query(models.Order)
        .filter(
            models.Order.id
            == order_id
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    customer = None

    if order.customer_id is not None:
        customer = (
            db.query(models.Customer)
            .filter(
                models.Customer.id
                == order.customer_id
            )
            .first()
        )

    if customer:
        customer.total_orders = max(
            int(customer.total_orders or 0)
            - 1,
            0,
        )

        customer.total_revenue = max(
            float(customer.total_revenue or 0)
            - float(order.amount or 0),
            0,
        )

        customer.paid_amount = min(
            float(customer.paid_amount or 0),
            float(customer.total_revenue or 0),
        )

        customer.pending_amount = max(
            float(customer.total_revenue or 0)
            - float(customer.paid_amount or 0),
            0,
        )

    db.delete(order)
    db.commit()

    return {
        "ok": True,
        "message": "Order deleted successfully",
    }


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
IST_OFFSET = timedelta(hours=5, minutes=30)
EARTH_RADIUS_KM = 6371.0088


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


def gps_distance_km(first, second):
    """Calculate distance between two GPS points."""
    first_lat = radians(first.latitude)
    second_lat = radians(second.latitude)
    latitude_delta = radians(
        second.latitude - first.latitude
    )
    longitude_delta = radians(
        second.longitude - first.longitude
    )

    value = (
        sin(latitude_delta / 2) ** 2
        + cos(first_lat)
        * cos(second_lat)
        * sin(longitude_delta / 2) ** 2
    )

    central_angle = 2 * atan2(
        sqrt(value),
        sqrt(max(1 - value, 0)),
    )

    return EARTH_RADIUS_KM * central_angle


def vehicle_mileage_kmpl(vehicle):
    vehicle_type = str(
        vehicle.vehicle_type or ""
    ).lower()

    if "truck" in vehicle_type:
        return 6.0

    if "tempo" in vehicle_type:
        return 10.0

    if "van" in vehicle_type:
        return 12.0

    return 14.0


def vehicle_fuel_price(vehicle):
    fuel_type = str(
        vehicle.fuel_type or "Diesel"
    ).lower()

    if "petrol" in fuel_type:
        return 105.0

    if "cng" in fuel_type:
        return 85.0

    return 92.0


def get_today_gps_summary(
    vehicle,
    db: Session,
):
    """Calculate today's distance using India Standard Time."""
    now_utc = datetime.utcnow()
    today_ist = (now_utc + IST_OFFSET).date()

    start_of_today_ist = datetime(
        today_ist.year,
        today_ist.month,
        today_ist.day,
    )

    start_of_today_utc = (
        start_of_today_ist - IST_OFFSET
    )

    locations = (
        db.query(models.VehicleLocation)
        .filter(
            models.VehicleLocation.vehicle_id
            == vehicle.id,
            models.VehicleLocation.recorded_at
            >= start_of_today_utc,
        )
        .order_by(
            models.VehicleLocation.recorded_at.asc(),
            models.VehicleLocation.id.asc(),
        )
        .all()
    )

    total_km = 0.0

    for previous, current in zip(
        locations,
        locations[1:],
    ):
        segment_km = gps_distance_km(
            previous,
            current,
        )

        previous_accuracy = float(
            previous.accuracy or 0
        )
        current_accuracy = float(
            current.accuracy or 0
        )

        # Ignore GPS movement caused only by location jitter.
        minimum_movement_km = max(
            0.02,
            max(
                previous_accuracy,
                current_accuracy,
            ) / 1000,
        )

        if segment_km < minimum_movement_km:
            continue

        elapsed_seconds = (
            current.recorded_at
            - previous.recorded_at
        ).total_seconds()

        if elapsed_seconds <= 0:
            continue

        calculated_speed = (
            segment_km
            / (elapsed_seconds / 3600)
        )

        # Ignore impossible jumps produced by weak GPS signals.
        if calculated_speed > 180:
            continue

        total_km += segment_km

    mileage = vehicle_mileage_kmpl(vehicle)
    estimated_liters = (
        total_km / mileage
        if mileage > 0
        else 0
    )
    estimated_cost = (
        estimated_liters
        * vehicle_fuel_price(vehicle)
    )

    return {
        "today_km": round(total_km, 2),
        "estimated_fuel_liters": round(
            estimated_liters,
            2,
        ),
        "estimated_fuel_cost": round(
            estimated_cost,
            2,
        ),
        "mileage_kmpl": mileage,
    }


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

        gps_summary = get_today_gps_summary(
            vehicle,
            db,
        )

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
            **gps_summary,
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

    gps_summary = get_today_gps_summary(
        vehicle,
        db,
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
        **gps_summary,
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
# =========================================================
# CUSTOMERS
# =========================================================
@app.get(
    "/api/customers",
    response_model=list[schemas.CustomerOut],
)
def list_customers(
    search: str = "",
    status: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(models.Customer)

    if search.strip():
        search_value = f"%{search.strip()}%"

        query = query.filter(
            models.Customer.name.ilike(search_value)
            |
            models.Customer.phone.ilike(search_value)
            |
            models.Customer.company_name.ilike(search_value)
            |
            models.Customer.city.ilike(search_value)
        )

    if status.strip():
        query = query.filter(
            models.Customer.status
            == status.strip()
        )

    customers = (
        query
        .order_by(models.Customer.id.desc())
        .all()
    )

    return customers


@app.post(
    "/api/customers",
    response_model=schemas.CustomerOut,
    status_code=201,
)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
):
    customer_name = customer.name.strip()

    if not customer_name:
        raise HTTPException(
            status_code=400,
            detail="Customer name is required",
        )

    phone = customer.phone.strip()
    email = customer.email.strip().lower()

    if phone:
        existing_phone = (
            db.query(models.Customer)
            .filter(
                models.Customer.phone == phone
            )
            .first()
        )

        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Customer with this phone "
                    "already exists"
                ),
            )

    if email:
        existing_email = (
            db.query(models.Customer)
            .filter(
                models.Customer.email == email
            )
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Customer with this email "
                    "already exists"
                ),
            )

    if (
        customer.paid_amount
        > customer.total_revenue
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Paid amount cannot be greater "
                "than total revenue"
            ),
        )

    pending_amount = max(
        customer.total_revenue
        - customer.paid_amount,
        0,
    )

    new_customer = models.Customer(
        name=customer_name,
        phone=phone,
        email=email,
        company_name=(
            customer.company_name.strip()
        ),
        gst_number=(
            customer.gst_number.strip().upper()
        ),
        address=customer.address.strip(),
        city=customer.city.strip(),
        state=(
            customer.state.strip()
            or "Maharashtra"
        ),
        pincode=customer.pincode.strip(),
        status=(
            customer.status.strip()
            or "Active"
        ),
        total_orders=customer.total_orders,
        total_trips=customer.total_trips,
        total_revenue=customer.total_revenue,
        paid_amount=customer.paid_amount,
        pending_amount=pending_amount,
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


@app.put(
    "/api/customers/{customer_id}",
    response_model=schemas.CustomerOut,
)
def update_customer(
    customer_id: int,
    customer: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
):
    existing_customer = (
        db.query(models.Customer)
        .filter(
            models.Customer.id
            == customer_id
        )
        .first()
    )

    if not existing_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    update_data = customer.model_dump(
        exclude_unset=True
    )

    text_fields = [
        "name",
        "phone",
        "email",
        "company_name",
        "gst_number",
        "address",
        "city",
        "state",
        "pincode",
        "status",
    ]

    for field_name in text_fields:
        if (
            field_name in update_data
            and update_data[field_name]
            is not None
        ):
            update_data[field_name] = (
                update_data[field_name].strip()
            )

    if "email" in update_data:
        update_data["email"] = (
            update_data["email"].lower()
        )

    if "gst_number" in update_data:
        update_data["gst_number"] = (
            update_data["gst_number"].upper()
        )

    if (
        "name" in update_data
        and not update_data["name"]
    ):
        raise HTTPException(
            status_code=400,
            detail="Customer name is required",
        )

    updated_revenue = float(
        update_data.get(
            "total_revenue",
            existing_customer.total_revenue,
        )
    )

    updated_paid = float(
        update_data.get(
            "paid_amount",
            existing_customer.paid_amount,
        )
    )

    if updated_paid > updated_revenue:
        raise HTTPException(
            status_code=400,
            detail=(
                "Paid amount cannot be greater "
                "than total revenue"
            ),
        )

    update_data["pending_amount"] = max(
        updated_revenue - updated_paid,
        0,
    )

    for field_name, field_value in (
        update_data.items()
    ):
        setattr(
            existing_customer,
            field_name,
            field_value,
        )

    db.commit()
    db.refresh(existing_customer)

    return existing_customer


@app.delete(
    "/api/customers/{customer_id}"
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = (
        db.query(models.Customer)
        .filter(
            models.Customer.id
            == customer_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    db.delete(customer)
    db.commit()

    return {
        "ok": True,
        "message": "Customer deleted successfully",
    }

