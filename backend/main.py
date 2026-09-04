from datetime import date, datetime, timedelta
from math import atan2, cos, radians, sin, sqrt

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

import models
import schemas

from database import engine, get_db, Base
from sqlalchemy import inspect, text, or_
import uuid
from pathlib import Path
from typing import Optional

from fastapi import File, Form, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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
            "vehicle_id": "INTEGER",
            "goods_name": "VARCHAR DEFAULT ''",
            "quantity": "VARCHAR DEFAULT ''",
            "weight_kg": "FLOAT DEFAULT 0",
            "receiver_name": "VARCHAR DEFAULT ''",
            "receiver_phone": "VARCHAR DEFAULT ''",
            "origin": "VARCHAR DEFAULT ''",
            "destination": "VARCHAR DEFAULT ''",
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
# DOCUMENT FILE STORAGE
# =========================================================

UPLOAD_ROOT = Path(__file__).resolve().parent / "uploads"
DOCUMENT_UPLOAD_DIR = UPLOAD_ROOT / "documents"

DOCUMENT_UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_ROOT)),
    name="uploads",
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

    vehicle = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle.id
            == order.vehicle_id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    goods_name = order.goods_name.strip()
    receiver_name = order.receiver_name.strip()
    receiver_phone = order.receiver_phone.strip()
    origin = order.origin.strip()
    destination = order.destination.strip()

    if not goods_name:
        raise HTTPException(
            status_code=400,
            detail="Goods name is required",
        )

    if not receiver_name:
        raise HTTPException(
            status_code=400,
            detail="Receiver name is required",
        )

    if not receiver_phone:
        raise HTTPException(
            status_code=400,
            detail="Receiver phone is required",
        )

    if not origin or not destination:
        raise HTTPException(
            status_code=400,
            detail="Pickup and destination are required",
        )

    if origin.lower() == destination.lower():
        raise HTTPException(
            status_code=400,
            detail=(
                "Pickup and destination "
                "cannot be the same"
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
        vehicle_id=vehicle.id,
        goods_name=goods_name,
        quantity=order.quantity.strip(),
        weight_kg=order.weight_kg,
        receiver_name=receiver_name,
        receiver_phone=receiver_phone,
        origin=origin,
        destination=destination,
        status=(
            order.status.strip()
            or "Pending"
        ),
        amount=order.amount,
        created_at=created_date,
    )

    db.add(new_order)

    new_trip = models.Trip(
        vehicle_id=vehicle.id,
        origin=origin,
        destination=destination,
        progress=0,
        status="Ongoing",
    )

    db.add(new_trip)

    customer.total_orders = (
        int(customer.total_orders or 0)
        + 1
    )

    customer.total_trips = (
        int(customer.total_trips or 0)
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
# INCOME / CUSTOMER PAYMENTS
# =========================================================

INCOME_APPLIED_STATUSES = {
    "received",
    "partial",
}


def normalize_payment_status(value: str) -> str:
    status_map = {
        "received": "Received",
        "partial": "Partial",
        "pending": "Pending",
    }

    normalized = status_map.get(
        (value or "").strip().lower()
    )

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment status must be "
                "Received, Partial or Pending"
            ),
        )

    return normalized


def payment_is_applied(status: str) -> bool:
    return (
        (status or "").strip().lower()
        in INCOME_APPLIED_STATUSES
    )


def update_customer_payment(
    customer,
    amount_change: float,
):
    updated_paid = max(
        float(customer.paid_amount or 0)
        + float(amount_change or 0),
        0,
    )

    total_revenue = float(
        customer.total_revenue or 0
    )

    if updated_paid > total_revenue:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment amount cannot be greater "
                "than customer pending amount"
            ),
        )

    customer.paid_amount = updated_paid
    customer.pending_amount = max(
        total_revenue - updated_paid,
        0,
    )


@app.get(
    "/api/income",
    response_model=list[schemas.IncomeOut],
)
def list_income(
    customer_id: int | None = None,
    order_id: int | None = None,
    payment_status: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(models.IncomeRecord)

    if customer_id is not None:
        query = query.filter(
            models.IncomeRecord.customer_id
            == customer_id
        )

    if order_id is not None:
        query = query.filter(
            models.IncomeRecord.order_id
            == order_id
        )

    if payment_status.strip():
        query = query.filter(
            models.IncomeRecord.payment_status
            == payment_status.strip()
        )

    return (
        query
        .order_by(
            models.IncomeRecord.payment_date.desc(),
            models.IncomeRecord.id.desc(),
        )
        .all()
    )


@app.get("/api/income/summary")
def get_income_summary(
    db: Session = Depends(get_db),
):
    records = db.query(models.IncomeRecord).all()
    customers = db.query(models.Customer).all()
    today = date.today()

    received_records = [
        record
        for record in records
        if payment_is_applied(
            record.payment_status
        )
    ]

    total_income = sum(
        float(record.amount or 0)
        for record in received_records
    )

    this_month_income = sum(
        float(record.amount or 0)
        for record in received_records
        if (
            record.payment_date.year
            == today.year
            and record.payment_date.month
            == today.month
        )
    )

    pending_amount = sum(
        float(customer.pending_amount or 0)
        for customer in customers
    )

    return {
        "total_income": round(total_income, 2),
        "this_month_income": round(
            this_month_income,
            2,
        ),
        "pending_amount": round(
            pending_amount,
            2,
        ),
        "payment_count": len(records),
    }


@app.post(
    "/api/income",
    response_model=schemas.IncomeOut,
    status_code=201,
)
def create_income(
    income: schemas.IncomeCreate,
    db: Session = Depends(get_db),
):
    customer = (
        db.query(models.Customer)
        .filter(
            models.Customer.id
            == income.customer_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    order = None

    if income.order_id is not None:
        order = (
            db.query(models.Order)
            .filter(
                models.Order.id
                == income.order_id
            )
            .first()
        )

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        if order.customer_id != customer.id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Selected order does not belong "
                    "to this customer"
                ),
            )

    vehicle_id = (
        income.vehicle_id
        if income.vehicle_id is not None
        else (order.vehicle_id if order else None)
    )

    if vehicle_id is not None:
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
                detail="Vehicle not found",
            )

    payment_status = normalize_payment_status(
        income.payment_status
    )

    if payment_is_applied(payment_status):
        update_customer_payment(
            customer,
            income.amount,
        )

    record = models.IncomeRecord(
        customer_id=customer.id,
        order_id=income.order_id,
        vehicle_id=vehicle_id,
        amount=income.amount,
        payment_mode=(
            income.payment_mode.strip()
            or "Cash"
        ),
        payment_status=payment_status,
        transaction_reference=(
            income.transaction_reference.strip()
        ),
        notes=income.notes.strip(),
        payment_date=income.payment_date,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@app.put(
    "/api/income/{income_id}",
    response_model=schemas.IncomeOut,
)
def update_income(
    income_id: int,
    income: schemas.IncomeUpdate,
    db: Session = Depends(get_db),
):
    record = (
        db.query(models.IncomeRecord)
        .filter(
            models.IncomeRecord.id
            == income_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Income record not found",
        )

    data = income.model_dump(
        exclude_unset=True
    )

    old_customer = record.customer
    old_applied_amount = (
        float(record.amount or 0)
        if payment_is_applied(
            record.payment_status
        )
        else 0
    )

    new_customer_id = data.get(
        "customer_id",
        record.customer_id,
    )

    if new_customer_id is None:
        raise HTTPException(
            status_code=400,
            detail="Customer is required",
        )

    new_customer = (
        db.query(models.Customer)
        .filter(
            models.Customer.id
            == new_customer_id
        )
        .first()
    )

    if not new_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    new_order_id = data.get(
        "order_id",
        record.order_id,
    )
    new_order = None

    if new_order_id is not None:
        new_order = (
            db.query(models.Order)
            .filter(
                models.Order.id
                == new_order_id
            )
            .first()
        )

        if not new_order:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        if new_order.customer_id != new_customer.id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Selected order does not belong "
                    "to this customer"
                ),
            )

    new_status = normalize_payment_status(
        data.get(
            "payment_status",
            record.payment_status,
        )
    )
    new_amount = float(
        data.get("amount", record.amount)
    )
    new_applied_amount = (
        new_amount
        if payment_is_applied(new_status)
        else 0
    )

    if old_customer.id == new_customer.id:
        update_customer_payment(
            old_customer,
            new_applied_amount
            - old_applied_amount,
        )
    else:
        update_customer_payment(
            old_customer,
            -old_applied_amount,
        )
        update_customer_payment(
            new_customer,
            new_applied_amount,
        )

    new_vehicle_id = data.get(
        "vehicle_id",
        record.vehicle_id,
    )

    if new_vehicle_id is None and new_order:
        new_vehicle_id = new_order.vehicle_id

    if new_vehicle_id is not None:
        vehicle_exists = (
            db.query(models.Vehicle)
            .filter(
                models.Vehicle.id
                == new_vehicle_id
            )
            .first()
        )

        if not vehicle_exists:
            raise HTTPException(
                status_code=404,
                detail="Vehicle not found",
            )

    record.customer_id = new_customer.id
    record.order_id = new_order_id
    record.vehicle_id = new_vehicle_id
    record.amount = new_amount
    record.payment_status = new_status

    for field_name in [
        "payment_mode",
        "transaction_reference",
        "notes",
    ]:
        if field_name in data:
            value = data[field_name]
            setattr(
                record,
                field_name,
                (value or "").strip(),
            )

    if "payment_date" in data:
        record.payment_date = data[
            "payment_date"
        ]

    db.commit()
    db.refresh(record)

    return record


@app.delete("/api/income/{income_id}")
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
):
    record = (
        db.query(models.IncomeRecord)
        .filter(
            models.IncomeRecord.id
            == income_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Income record not found",
        )

    if payment_is_applied(
        record.payment_status
    ):
        update_customer_payment(
            record.customer,
            -float(record.amount or 0),
        )

    db.delete(record)
    db.commit()

    return {
        "ok": True,
        "message": "Income record deleted",
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

# =========================================================
# EXPENSE MANAGEMENT
# =========================================================

@app.get(
    "/api/expenses",
    response_model=list[schemas.ExpenseOut],
)
def list_expenses(
    category: str = "",
    status: str = "",
    vehicle_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.ExpenseRecord)

    if category.strip():
        query = query.filter(
            models.ExpenseRecord.category == category.strip()
        )

    if status.strip():
        query = query.filter(
            models.ExpenseRecord.status == status.strip()
        )

    if vehicle_id is not None:
        query = query.filter(
            models.ExpenseRecord.vehicle_id == vehicle_id
        )

    return query.order_by(
        models.ExpenseRecord.expense_date.desc(),
        models.ExpenseRecord.id.desc(),
    ).all()


@app.get("/api/expenses/summary")
def get_expense_summary(
    db: Session = Depends(get_db),
):
    records = db.query(models.ExpenseRecord).all()
    today = date.today()

    total_expenses = sum(
        float(record.amount or 0)
        for record in records
    )

    this_month = sum(
        float(record.amount or 0)
        for record in records
        if record.expense_date
        and record.expense_date.year == today.year
        and record.expense_date.month == today.month
    )

    vehicle_expenses = sum(
        float(record.amount or 0)
        for record in records
        if record.vehicle_id is not None
    )

    pending_amount = sum(
        float(record.amount or 0)
        for record in records
        if str(record.status or "").lower() == "pending"
    )

    return {
        "total_expenses": round(total_expenses, 2),
        "this_month": round(this_month, 2),
        "vehicle_expenses": round(vehicle_expenses, 2),
        "pending_amount": round(pending_amount, 2),
        "total_records": len(records),
    }


@app.post(
    "/api/expenses",
    response_model=schemas.ExpenseOut,
    status_code=201,
)
def create_expense(
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
):
    category = payload.category.strip()

    if not category:
        raise HTTPException(
            status_code=400,
            detail="Expense category is required",
        )

    if payload.vehicle_id is not None:
        vehicle = (
            db.query(models.Vehicle)
            .filter(models.Vehicle.id == payload.vehicle_id)
            .first()
        )

        if not vehicle:
            raise HTTPException(
                status_code=404,
                detail="Vehicle not found",
            )

    if payload.driver_id is not None:
        driver = (
            db.query(models.Driver)
            .filter(models.Driver.id == payload.driver_id)
            .first()
        )

        if not driver:
            raise HTTPException(
                status_code=404,
                detail="Driver not found",
            )

    expense = models.ExpenseRecord(
        category=category,
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        vendor_name=payload.vendor_name.strip(),
        amount=round(payload.amount, 2),
        expense_date=payload.expense_date,
        payment_mode=payload.payment_mode.strip() or "Cash",
        reference_number=payload.reference_number.strip(),
        status=payload.status.strip() or "Paid",
        notes=payload.notes.strip(),
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


@app.put(
    "/api/expenses/{expense_id}",
    response_model=schemas.ExpenseOut,
)
def update_expense(
    expense_id: int,
    payload: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
):
    expense = (
        db.query(models.ExpenseRecord)
        .filter(models.ExpenseRecord.id == expense_id)
        .first()
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense record not found",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    if "category" in update_data:
        category = (
            update_data["category"] or ""
        ).strip()

        if not category:
            raise HTTPException(
                status_code=400,
                detail="Expense category is required",
            )

        update_data["category"] = category

    if (
        "vehicle_id" in update_data
        and update_data["vehicle_id"] is not None
    ):
        vehicle = (
            db.query(models.Vehicle)
            .filter(
                models.Vehicle.id
                == update_data["vehicle_id"]
            )
            .first()
        )

        if not vehicle:
            raise HTTPException(
                status_code=404,
                detail="Vehicle not found",
            )

    if (
        "driver_id" in update_data
        and update_data["driver_id"] is not None
    ):
        driver = (
            db.query(models.Driver)
            .filter(
                models.Driver.id
                == update_data["driver_id"]
            )
            .first()
        )

        if not driver:
            raise HTTPException(
                status_code=404,
                detail="Driver not found",
            )

    text_fields = [
        "vendor_name",
        "payment_mode",
        "reference_number",
        "status",
        "notes",
    ]

    for field_name in text_fields:
        if field_name in update_data:
            update_data[field_name] = (
                update_data[field_name] or ""
            ).strip()

    if "amount" in update_data:
        update_data["amount"] = round(
            update_data["amount"],
            2,
        )

    for field_name, value in update_data.items():
        setattr(expense, field_name, value)

    db.commit()
    db.refresh(expense)

    return expense


@app.delete("/api/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
):
    expense = (
        db.query(models.ExpenseRecord)
        .filter(models.ExpenseRecord.id == expense_id)
        .first()
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense record not found",
        )

    db.delete(expense)
    db.commit()

    return {
        "ok": True,
        "message": "Expense deleted successfully",
    }

# =========================================================
# PROFESSIONAL REPORTS DASHBOARD
# =========================================================

REPORT_EXPENSE_CATEGORIES = [
    "Fuel",
    "Maintenance",
    "Toll",
    "Driver Salary",
    "Office",
    "Insurance",
    "Repair",
    "Other",
]


def normalize_expense_category(value):
    category = str(value or "").strip()

    for available_category in REPORT_EXPENSE_CATEGORIES:
        if available_category.lower() == category.lower():
            return available_category

    return category or "Other"


@app.get("/api/reports/dashboard")
def get_reports_dashboard(
    month: str = "",
    db: Session = Depends(get_db),
):
    period_start = None
    period_end = None

    if month.strip():
        try:
            period_start = datetime.strptime(
                month.strip(),
                "%Y-%m",
            ).date()

            if period_start.month == 12:
                period_end = date(
                    period_start.year + 1,
                    1,
                    1,
                )
            else:
                period_end = date(
                    period_start.year,
                    period_start.month + 1,
                    1,
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Month must be in YYYY-MM format",
            )

    income_query = db.query(models.IncomeRecord)
    expense_query = db.query(models.ExpenseRecord)
    fuel_query = db.query(models.FuelLog)
    maintenance_query = db.query(
        models.MaintenanceRecord
    )

    if period_start and period_end:
        income_query = income_query.filter(
            models.IncomeRecord.payment_date
            >= period_start,
            models.IncomeRecord.payment_date
            < period_end,
        )

        expense_query = expense_query.filter(
            models.ExpenseRecord.expense_date
            >= period_start,
            models.ExpenseRecord.expense_date
            < period_end,
        )

        fuel_query = fuel_query.filter(
            models.FuelLog.date >= period_start,
            models.FuelLog.date < period_end,
        )

        maintenance_query = maintenance_query.filter(
            models.MaintenanceRecord.date
            >= period_start,
            models.MaintenanceRecord.date
            < period_end,
        )

    income_records = income_query.all()
    expense_records = expense_query.all()
    fuel_records = fuel_query.all()
    maintenance_records = maintenance_query.all()

    received_income = [
        record
        for record in income_records
        if str(
            record.payment_status or ""
        ).lower()
        not in ["pending", "cancelled"]
    ]

    total_income = sum(
        float(record.amount or 0)
        for record in received_income
    )

    total_expenses = sum(
        float(record.amount or 0)
        for record in expense_records
    )

    paid_expenses = sum(
        float(record.amount or 0)
        for record in expense_records
        if str(record.status or "").lower()
        == "paid"
    )

    pending_expenses = sum(
        float(record.amount or 0)
        for record in expense_records
        if str(record.status or "").lower()
        == "pending"
    )

    # -----------------------------------------------------
    # ALL EXPENSE CATEGORY TOTALS
    # -----------------------------------------------------

    category_totals = {
        category: {
            "category": category,
            "amount": 0.0,
            "count": 0,
        }
        for category in REPORT_EXPENSE_CATEGORIES
    }

    for record in expense_records:
        category = normalize_expense_category(
            record.category
        )

        if category not in category_totals:
            category_totals[category] = {
                "category": category,
                "amount": 0.0,
                "count": 0,
            }

        category_totals[category]["amount"] += float(
            record.amount or 0
        )

        category_totals[category]["count"] += 1

    expense_categories = sorted(
        [
            {
                "category": item["category"],
                "amount": round(
                    item["amount"],
                    2,
                ),
                "count": item["count"],
            }
            for item in category_totals.values()
        ],
        key=lambda item: item["amount"],
        reverse=True,
    )

    # -----------------------------------------------------
    # FUEL AND MAINTENANCE TOTALS
    # -----------------------------------------------------

    fuel_log_cost = sum(
        float(record.total_cost or 0)
        for record in fuel_records
    )

    fuel_expense_cost = category_totals[
        "Fuel"
    ]["amount"]

    fuel_cost = (
        fuel_expense_cost
        if fuel_expense_cost > 0
        else fuel_log_cost
    )

    maintenance_record_cost = sum(
        float(record.cost or 0)
        for record in maintenance_records
    )

    maintenance_expense_cost = category_totals[
        "Maintenance"
    ]["amount"]

    maintenance_cost = (
        maintenance_expense_cost
        if maintenance_expense_cost > 0
        else maintenance_record_cost
    )

    net_profit = total_income - total_expenses

    profit_margin = (
        (net_profit / total_income) * 100
        if total_income > 0
        else 0
    )

    vehicles = db.query(models.Vehicle).all()
    trips = db.query(models.Trip).all()

    # -----------------------------------------------------
    # COMPLETE VEHICLE PERFORMANCE
    # -----------------------------------------------------

    vehicle_reports = []

    for vehicle in vehicles:
        vehicle_income = sum(
            float(record.amount or 0)
            for record in received_income
            if record.vehicle_id == vehicle.id
        )

        vehicle_expense_records = [
            record
            for record in expense_records
            if record.vehicle_id == vehicle.id
        ]

        vehicle_total_expense = sum(
            float(record.amount or 0)
            for record in vehicle_expense_records
        )

        vehicle_categories = {
            category: 0.0
            for category in REPORT_EXPENSE_CATEGORIES
        }

        for record in vehicle_expense_records:
            category = normalize_expense_category(
                record.category
            )

            if category not in vehicle_categories:
                vehicle_categories[category] = 0.0

            vehicle_categories[category] += float(
                record.amount or 0
            )

        vehicle_fuel_log_cost = sum(
            float(record.total_cost or 0)
            for record in fuel_records
            if record.vehicle_id == vehicle.id
        )

        vehicle_maintenance_record_cost = sum(
            float(record.cost or 0)
            for record in maintenance_records
            if record.vehicle_id == vehicle.id
        )

        vehicle_fuel_cost = (
            vehicle_categories["Fuel"]
            if vehicle_categories["Fuel"] > 0
            else vehicle_fuel_log_cost
        )

        vehicle_maintenance_cost = (
            vehicle_categories["Maintenance"]
            if vehicle_categories["Maintenance"] > 0
            else vehicle_maintenance_record_cost
        )

        vehicle_trips = [
            trip
            for trip in trips
            if trip.vehicle_id == vehicle.id
        ]

        vehicle_profit = (
            vehicle_income - vehicle_total_expense
        )

        vehicle_reports.append({
            "vehicle_id": vehicle.id,
            "registration_number":
                vehicle.registration_number,
            "vehicle_type":
                vehicle.vehicle_type,
            "status":
                vehicle.status,
            "total_trips":
                len(vehicle_trips),

            "income": round(
                vehicle_income,
                2,
            ),

            "fuel_cost": round(
                vehicle_fuel_cost,
                2,
            ),

            "maintenance_cost": round(
                vehicle_maintenance_cost,
                2,
            ),

            "toll_cost": round(
                vehicle_categories["Toll"],
                2,
            ),

            "driver_salary": round(
                vehicle_categories["Driver Salary"],
                2,
            ),

            "office_cost": round(
                vehicle_categories["Office"],
                2,
            ),

            "insurance_cost": round(
                vehicle_categories["Insurance"],
                2,
            ),

            "repair_cost": round(
                vehicle_categories["Repair"],
                2,
            ),

            "other_cost": round(
                vehicle_categories["Other"],
                2,
            ),

            "expenses": round(
                vehicle_total_expense,
                2,
            ),

            "profit": round(
                vehicle_profit,
                2,
            ),
        })

    # -----------------------------------------------------
    # LAST SIX MONTHS CHART
    # -----------------------------------------------------

    selected_month = (
        period_start
        if period_start
        else date.today().replace(day=1)
    )

    selected_month_number = (
        selected_month.year * 12
        + selected_month.month
        - 1
    )

    all_income_records = (
        db.query(models.IncomeRecord).all()
    )

    all_expense_records = (
        db.query(models.ExpenseRecord).all()
    )

    monthly_data = []

    for offset in range(5, -1, -1):
        month_number = (
            selected_month_number - offset
        )

        year_value = month_number // 12
        month_value = month_number % 12 + 1

        month_start = date(
            year_value,
            month_value,
            1,
        )

        if month_value == 12:
            next_month = date(
                year_value + 1,
                1,
                1,
            )
        else:
            next_month = date(
                year_value,
                month_value + 1,
                1,
            )

        month_income = sum(
            float(record.amount or 0)
            for record in all_income_records
            if record.payment_date
            and month_start
            <= record.payment_date
            < next_month
            and str(
                record.payment_status or ""
            ).lower()
            not in ["pending", "cancelled"]
        )

        month_expense = sum(
            float(record.amount or 0)
            for record in all_expense_records
            if record.expense_date
            and month_start
            <= record.expense_date
            < next_month
        )

        monthly_data.append({
            "month": month_start.strftime(
                "%Y-%m"
            ),
            "label": month_start.strftime(
                "%b %Y"
            ),
            "income": round(
                month_income,
                2,
            ),
            "expenses": round(
                month_expense,
                2,
            ),
            "profit": round(
                month_income - month_expense,
                2,
            ),
        })

    # -----------------------------------------------------
    # FINAL REPORT RESPONSE
    # -----------------------------------------------------

    return {
        "period": month or "All Time",

        "summary": {
            "total_income": round(
                total_income,
                2,
            ),
            "total_expenses": round(
                total_expenses,
                2,
            ),
            "paid_expenses": round(
                paid_expenses,
                2,
            ),
            "pending_expenses": round(
                pending_expenses,
                2,
            ),
            "net_profit": round(
                net_profit,
                2,
            ),
            "profit_margin": round(
                profit_margin,
                1,
            ),

            "fuel_cost": round(
                fuel_cost,
                2,
            ),
            "maintenance_cost": round(
                maintenance_cost,
                2,
            ),
            "toll_cost": round(
                category_totals["Toll"]["amount"],
                2,
            ),
            "driver_salary": round(
                category_totals[
                    "Driver Salary"
                ]["amount"],
                2,
            ),
            "office_cost": round(
                category_totals["Office"]["amount"],
                2,
            ),
            "insurance_cost": round(
                category_totals[
                    "Insurance"
                ]["amount"],
                2,
            ),
            "repair_cost": round(
                category_totals["Repair"]["amount"],
                2,
            ),
            "other_cost": round(
                category_totals["Other"]["amount"],
                2,
            ),

            "total_vehicles": len(vehicles),
            "total_trips": len(trips),
            "income_records": len(
                income_records
            ),
            "expense_records": len(
                expense_records
            ),
        },

        "monthly_data": monthly_data,
        "expense_categories":
            expense_categories,
        "vehicle_reports":
            vehicle_reports,
    }

# =========================================================
# DOCUMENT MANAGEMENT HELPERS
# =========================================================

MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_DOCUMENT_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}


def parse_document_date(
    value: Optional[str],
    field_name: str,
):
    if not value or not value.strip():
        return None

    try:
        return date.fromisoformat(value.strip())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be YYYY-MM-DD",
        )


def get_document_expiry_details(expiry_date):
    if expiry_date is None:
        return "No Expiry", None

    days_remaining = (
        expiry_date - date.today()
    ).days

    if days_remaining < 0:
        return "Expired", days_remaining

    if days_remaining <= 30:
        return "Expiring Soon", days_remaining

    return "Valid", days_remaining


def document_to_response(document):
    expiry_status, days_remaining = (
        get_document_expiry_details(
            document.expiry_date
        )
    )

    return {
        "id": document.id,
        "document_type": document.document_type,
        "document_number": (
            document.document_number or ""
        ),
        "vehicle_id": document.vehicle_id,
        "driver_id": document.driver_id,
        "issuing_authority": (
            document.issuing_authority or ""
        ),
        "issue_date": document.issue_date,
        "expiry_date": document.expiry_date,
        "file_name": document.file_name or "",
        "stored_file_name": (
            document.stored_file_name or ""
        ),
        "file_url": document.file_url or "",
        "content_type": (
            document.content_type or ""
        ),
        "file_size": document.file_size or 0,
        "notes": document.notes or "",
        "created_at": document.created_at,
        "expiry_status": expiry_status,
        "days_remaining": days_remaining,
        "vehicle": document.vehicle,
        "driver": document.driver,
    }


def validate_document_assignment(
    db: Session,
    vehicle_id: Optional[int],
    driver_id: Optional[int],
):
    if vehicle_id is not None:
        vehicle = (
            db.query(models.Vehicle)
            .filter(
                models.Vehicle.id == vehicle_id
            )
            .first()
        )

        if not vehicle:
            raise HTTPException(
                status_code=404,
                detail="Vehicle not found",
            )

    if driver_id is not None:
        driver = (
            db.query(models.Driver)
            .filter(
                models.Driver.id == driver_id
            )
            .first()
        )

        if not driver:
            raise HTTPException(
                status_code=404,
                detail="Driver not found",
            )


# =========================================================
# DOCUMENT SUMMARY
# =========================================================

@app.get("/api/documents/summary")
def get_documents_summary(
    db: Session = Depends(get_db),
):
    documents = (
        db.query(models.TransportDocument)
        .all()
    )

    summary = {
        "total_documents": len(documents),
        "valid_documents": 0,
        "expiring_soon": 0,
        "expired_documents": 0,
        "no_expiry": 0,
    }

    for document in documents:
        expiry_status, _ = (
            get_document_expiry_details(
                document.expiry_date
            )
        )

        if expiry_status == "Valid":
            summary["valid_documents"] += 1
        elif expiry_status == "Expiring Soon":
            summary["expiring_soon"] += 1
        elif expiry_status == "Expired":
            summary["expired_documents"] += 1
        else:
            summary["no_expiry"] += 1

    return summary


# =========================================================
# LIST DOCUMENTS
# =========================================================

@app.get(
    "/api/documents",
    response_model=list[schemas.DocumentOut],
)
def list_documents(
    search: str = "",
    document_type: str = "",
    expiry_status: str = "",
    vehicle_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.TransportDocument)
        .outerjoin(
            models.Vehicle,
            models.TransportDocument.vehicle_id
            == models.Vehicle.id,
        )
        .outerjoin(
            models.Driver,
            models.TransportDocument.driver_id
            == models.Driver.id,
        )
    )

    if search.strip():
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                models.TransportDocument
                .document_type
                .ilike(search_value),

                models.TransportDocument
                .document_number
                .ilike(search_value),

                models.TransportDocument
                .issuing_authority
                .ilike(search_value),

                models.Vehicle
                .registration_number
                .ilike(search_value),

                models.Driver
                .name
                .ilike(search_value),
            )
        )

    if document_type.strip():
        query = query.filter(
            models.TransportDocument.document_type
            == document_type.strip()
        )

    if vehicle_id is not None:
        query = query.filter(
            models.TransportDocument.vehicle_id
            == vehicle_id
        )

    if driver_id is not None:
        query = query.filter(
            models.TransportDocument.driver_id
            == driver_id
        )

    documents = (
        query.order_by(
            models.TransportDocument.id.desc()
        )
        .all()
    )

    results = [
        document_to_response(document)
        for document in documents
    ]

    if expiry_status.strip():
        selected_status = expiry_status.strip()

        results = [
            document
            for document in results
            if document["expiry_status"]
            == selected_status
        ]

    return results


# =========================================================
# UPLOAD DOCUMENT
# =========================================================

@app.post(
    "/api/documents/upload",
    response_model=schemas.DocumentOut,
    status_code=201,
)
async def upload_document(
    document_type: str = Form(...),
    document_number: str = Form(""),
    vehicle_id: Optional[int] = Form(None),
    driver_id: Optional[int] = Form(None),
    issuing_authority: str = Form(""),
    issue_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    notes: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    clean_document_type = document_type.strip()

    if not clean_document_type:
        raise HTTPException(
            status_code=400,
            detail="Document type is required",
        )

    validate_document_assignment(
        db,
        vehicle_id,
        driver_id,
    )

    parsed_issue_date = parse_document_date(
        issue_date,
        "Issue date",
    )

    parsed_expiry_date = parse_document_date(
        expiry_date,
        "Expiry date",
    )

    if (
        parsed_issue_date
        and parsed_expiry_date
        and parsed_expiry_date
        < parsed_issue_date
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Expiry date cannot be before "
                "issue date"
            ),
        )

    if (
        file.content_type
        not in ALLOWED_DOCUMENT_CONTENT_TYPES
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF, JPG and PNG files "
                "are allowed"
            ),
        )

    file_content = await file.read(
        MAX_DOCUMENT_FILE_SIZE + 1
    )

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    if len(file_content) > MAX_DOCUMENT_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must be 10 MB or less",
        )

    extension = (
        ALLOWED_DOCUMENT_CONTENT_TYPES[
            file.content_type
        ]
    )

    stored_file_name = (
        f"{uuid.uuid4().hex}{extension}"
    )

    file_path = (
        DOCUMENT_UPLOAD_DIR / stored_file_name
    )

    try:
        file_path.write_bytes(file_content)
    except OSError:
        raise HTTPException(
            status_code=500,
            detail="Document file could not be saved",
        )
    finally:
        await file.close()

    new_document = models.TransportDocument(
        document_type=clean_document_type,
        document_number=document_number.strip(),
        vehicle_id=vehicle_id,
        driver_id=driver_id,
        issuing_authority=(
            issuing_authority.strip()
        ),
        issue_date=parsed_issue_date,
        expiry_date=parsed_expiry_date,
        file_name=file.filename or stored_file_name,
        stored_file_name=stored_file_name,
        file_url=(
            f"/uploads/documents/"
            f"{stored_file_name}"
        ),
        content_type=file.content_type or "",
        file_size=len(file_content),
        notes=notes.strip(),
    )

    try:
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Document record could not be saved",
        )

    return document_to_response(new_document)


# =========================================================
# UPDATE DOCUMENT DETAILS
# =========================================================

@app.put(
    "/api/documents/{document_id}",
    response_model=schemas.DocumentOut,
)
def update_document(
    document_id: int,
    payload: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
):
    document = (
        db.query(models.TransportDocument)
        .filter(
            models.TransportDocument.id
            == document_id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    new_vehicle_id = update_data.get(
        "vehicle_id",
        document.vehicle_id,
    )

    new_driver_id = update_data.get(
        "driver_id",
        document.driver_id,
    )

    validate_document_assignment(
        db,
        new_vehicle_id,
        new_driver_id,
    )

    new_issue_date = update_data.get(
        "issue_date",
        document.issue_date,
    )

    new_expiry_date = update_data.get(
        "expiry_date",
        document.expiry_date,
    )

    if (
        new_issue_date
        and new_expiry_date
        and new_expiry_date < new_issue_date
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Expiry date cannot be before "
                "issue date"
            ),
        )

    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()

        setattr(document, field, value)

    db.commit()
    db.refresh(document)

    return document_to_response(document)


# =========================================================
# DOWNLOAD DOCUMENT
# =========================================================

@app.get(
    "/api/documents/{document_id}/download"
)
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    document = (
        db.query(models.TransportDocument)
        .filter(
            models.TransportDocument.id
            == document_id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    file_path = (
        DOCUMENT_UPLOAD_DIR
        / document.stored_file_name
    )

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Document file not found",
        )

    return FileResponse(
        path=str(file_path),
        media_type=(
            document.content_type
            or "application/octet-stream"
        ),
        filename=(
            document.file_name
            or document.stored_file_name
        ),
    )


# =========================================================
# DELETE DOCUMENT
# =========================================================

@app.delete(
    "/api/documents/{document_id}"
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    document = (
        db.query(models.TransportDocument)
        .filter(
            models.TransportDocument.id
            == document_id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    stored_file_name = (
        document.stored_file_name or ""
    )

    db.delete(document)
    db.commit()

    if stored_file_name:
        file_path = (
            DOCUMENT_UPLOAD_DIR
            / stored_file_name
        )

        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass

    return {
        "ok": True,
        "message": "Document deleted successfully",
    }