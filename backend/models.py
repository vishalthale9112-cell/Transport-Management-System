import secrets
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from database import Base


# =========================================================
# DRIVERS
# =========================================================

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    photo_url = Column(String, default="")
    license_number = Column(String, default="")

    vehicles = relationship(
        "Vehicle",
        back_populates="driver",
    )


# =========================================================
# VEHICLES
# =========================================================

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)

    registration_number = Column(
        String,
        unique=True,
        nullable=False,
    )

    vehicle_type = Column(
        String,
        default="Truck",
    )

    fuel_type = Column(
        String,
        default="Diesel",
    )

    status = Column(
        String,
        default="Active",
    )

    latitude = Column(
        Float,
        default=19.0760,
    )

    longitude = Column(
        Float,
        default=72.8777,
    )

    trip_progress = Column(
        Integer,
        default=0,
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=True,
    )

    service_due_in_days = Column(
        Integer,
        default=30,
    )

    insurance_expiry = Column(
        Date,
        nullable=True,
    )

    driver = relationship(
        "Driver",
        back_populates="vehicles",
    )


# =========================================================
# ORDERS
# =========================================================

class Order(Base):
    __tablename__ = "orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    order_code = Column(
        String,
        unique=True,
        nullable=False,
    )

    customer_name = Column(
        String,
        nullable=False,
    )

    status = Column(
        String,
        default="Pending",
    )

    amount = Column(
        Float,
        default=0,
    )

    created_at = Column(Date)


# =========================================================
# TRIPS
# =========================================================

class Trip(Base):
    __tablename__ = "trips"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
    )

    origin = Column(String)
    destination = Column(String)

    progress = Column(
        Integer,
        default=0,
    )

    status = Column(
        String,
        default="Ongoing",
    )


# =========================================================
# MONTHLY FINANCE
# =========================================================

class MonthlyFinance(Base):
    __tablename__ = "monthly_finance"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    month = Column(
        String,
        nullable=False,
    )

    revenue = Column(
        Float,
        default=0,
    )

    expenses = Column(
        Float,
        default=0,
    )


# =========================================================
# ALERTS
# =========================================================

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    title = Column(
        String,
        nullable=False,
    )

    severity = Column(
        String,
        default="info",
    )

    minutes_ago = Column(
        Integer,
        default=0,
    )


# =========================================================
# FUEL LOGS
# =========================================================

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False,
    )

    fuel_type = Column(
        String,
        default="Diesel",
        nullable=False,
    )

    liters = Column(
        Float,
        nullable=False,
    )

    price_per_liter = Column(
        Float,
        nullable=False,
    )

    total_cost = Column(
        Float,
        nullable=False,
    )

    odometer = Column(
        Integer,
        default=0,
    )

    station_name = Column(
        String,
        default="",
    )

    date = Column(
        Date,
        nullable=False,
    )

    vehicle = relationship("Vehicle")


# =========================================================
# MAINTENANCE RECORDS
# =========================================================

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False,
    )

    service_type = Column(
        String,
        nullable=False,
    )

    brand = Column(
        String,
        default="",
    )

    driver_name = Column(
        String,
        default="",
    )

    cost = Column(
        Float,
        default=0,
    )

    next_due_days = Column(
        Integer,
        default=30,
    )

    date = Column(
        Date,
        nullable=False,
    )

    vehicle = relationship("Vehicle")


# =========================================================
# VEHICLE GPS TRACKERS
# =========================================================

class VehicleGpsTracker(Base):
    __tablename__ = "vehicle_gps_trackers"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    tracking_token = Column(
        String(120),
        unique=True,
        nullable=False,
        index=True,
        default=lambda: secrets.token_urlsafe(32),
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    last_seen_at = Column(
        DateTime,
        nullable=True,
    )

    vehicle = relationship("Vehicle")


# =========================================================
# VEHICLE GPS LOCATION HISTORY
# =========================================================

class VehicleLocation(Base):
    __tablename__ = "vehicle_locations"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False,
        index=True,
    )

    latitude = Column(
        Float,
        nullable=False,
    )

    longitude = Column(
        Float,
        nullable=False,
    )

    accuracy = Column(
        Float,
        nullable=True,
    )

    # Speed kilometre per hour मध्ये save होईल
    speed = Column(
        Float,
        nullable=True,
    )

    heading = Column(
        Float,
        nullable=True,
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    vehicle = relationship("Vehicle")
# =========================================================
# CUSTOMERS
# =========================================================

class Customer(Base):
    __tablename__ = "customers"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    phone = Column(
        String,
        default="",
    )

    email = Column(
        String,
        default="",
    )

    company_name = Column(
        String,
        default="",
    )

    gst_number = Column(
        String,
        default="",
    )

    address = Column(
        String,
        default="",
    )

    city = Column(
        String,
        default="",
    )

    state = Column(
        String,
        default="Maharashtra",
    )

    pincode = Column(
        String,
        default="",
    )

    status = Column(
        String,
        default="Active",
    )

    total_orders = Column(
        Integer,
        default=0,
    )

    total_trips = Column(
        Integer,
        default=0,
    )

    total_revenue = Column(
        Float,
        default=0,
    )

    paid_amount = Column(
        Float,
        default=0,
    )

    pending_amount = Column(
        Float,
        default=0,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )