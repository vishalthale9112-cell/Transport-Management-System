from datetime import date, datetime
import secrets

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base


# =========================================================
# COMPANIES / TENANT MEMBERSHIP
# =========================================================

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    members = relationship(
        "CompanyMember",
        back_populates="company",
        cascade="all, delete-orphan",
    )


class CompanyMember(Base):
    __tablename__ = "company_members"
    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "user_id",
            name="uq_company_member_user",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(String, nullable=False, index=True)
    email = Column(String, default="", nullable=False)
    role = Column(String, default="staff", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="members")


class TenantMixin:
    """Marks a row as belonging to exactly one customer company."""

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


# =========================================================
# DRIVERS
# =========================================================

class Driver(TenantMixin, Base):
    __tablename__ = "drivers"

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

    photo_url = Column(
        String,
        default="",
    )

    license_number = Column(
        String,
        default="",
    )

    vehicles = relationship(
        "Vehicle",
        back_populates="driver",
    )


# =========================================================
# VEHICLES
# =========================================================

class Vehicle(TenantMixin, Base):
    __tablename__ = "vehicles"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

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

    trips = relationship(
        "Trip",
        back_populates="vehicle",
    )

    fuel_logs = relationship(
        "FuelLog",
        back_populates="vehicle",
    )

    maintenance_records = relationship(
        "MaintenanceRecord",
        back_populates="vehicle",
    )

    gps_tracker = relationship(
        "VehicleGpsTracker",
        back_populates="vehicle",
        uselist=False,
    )

    locations = relationship(
        "VehicleLocation",
        back_populates="vehicle",
    )

    orders = relationship(
        "Order",
        back_populates="vehicle",
    )

    income_records = relationship(
        "IncomeRecord",
        back_populates="vehicle",
    )


# =========================================================
# CUSTOMERS
# =========================================================

class Customer(TenantMixin, Base):
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

    orders = relationship(
        "Order",
        back_populates="customer",
    )

    income_records = relationship(
        "IncomeRecord",
        back_populates="customer",
    )


# =========================================================
# ORDERS
# =========================================================

class Order(TenantMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "order_code",
            name="uq_orders_company_code",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    order_code = Column(
        String,
        nullable=False,
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=True,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=True,
    )

    customer_name = Column(
        String,
        nullable=False,
    )

    goods_name = Column(
        String,
        default="",
    )

    quantity = Column(
        String,
        default="",
    )

    weight_kg = Column(
        Float,
        default=0,
    )

    receiver_name = Column(
        String,
        default="",
    )

    receiver_phone = Column(
        String,
        default="",
    )

    origin = Column(
        String,
        default="",
    )

    destination = Column(
        String,
        default="",
    )

    status = Column(
        String,
        default="Pending",
    )

    amount = Column(
        Float,
        default=0,
    )

    created_at = Column(
        Date,
        default=date.today,
    )

    customer = relationship(
        "Customer",
        back_populates="orders",
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="orders",
    )

    income_records = relationship(
        "IncomeRecord",
        back_populates="order",
    )


# =========================================================
# TRIPS
# =========================================================

class Trip(TenantMixin, Base):
    __tablename__ = "trips"

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

    origin = Column(
        String,
        default="",
    )

    destination = Column(
        String,
        default="",
    )

    distance_km = Column(
        Float,
        default=0,
        nullable=False,
    )

    progress = Column(
        Integer,
        default=0,
    )

    status = Column(
        String,
        default="Ongoing",
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="trips",
    )


# =========================================================
# MONTHLY FINANCE
# =========================================================

class MonthlyFinance(TenantMixin, Base):
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
# INCOME RECORDS
# =========================================================

class IncomeRecord(TenantMixin, Base):
    __tablename__ = "income_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False,
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=True,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=True,
    )

    amount = Column(
        Float,
        default=0,
        nullable=False,
    )

    payment_mode = Column(
        String,
        default="Cash",
    )

    payment_status = Column(
        String,
        default="Received",
    )

    transaction_reference = Column(
        String,
        default="",
    )

    notes = Column(
        String,
        default="",
    )

    payment_date = Column(
        Date,
        default=date.today,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    customer = relationship(
        "Customer",
        back_populates="income_records",
    )

    order = relationship(
        "Order",
        back_populates="income_records",
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="income_records",
    )


# =========================================================
# OLD ALERTS
# =========================================================

class Alert(TenantMixin, Base):
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

class FuelLog(TenantMixin, Base):
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

    vehicle = relationship(
        "Vehicle",
        back_populates="fuel_logs",
    )


# =========================================================
# MAINTENANCE
# =========================================================

class MaintenanceRecord(TenantMixin, Base):
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

    vehicle = relationship(
        "Vehicle",
        back_populates="maintenance_records",
    )


# =========================================================
# EXPENSES
# =========================================================

class ExpenseRecord(TenantMixin, Base):
    __tablename__ = "expense_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    category = Column(
        String,
        nullable=False,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=True,
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=True,
    )

    vendor_name = Column(
        String,
        default="",
    )

    amount = Column(
        Float,
        default=0,
        nullable=False,
    )

    expense_date = Column(
        Date,
        default=date.today,
        nullable=False,
    )

    payment_mode = Column(
        String,
        default="Cash",
    )

    reference_number = Column(
        String,
        default="",
    )

    status = Column(
        String,
        default="Paid",
    )

    notes = Column(
        String,
        default="",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    vehicle = relationship("Vehicle")
    driver = relationship("Driver")


# =========================================================
# GPS TRACKER
# =========================================================

class VehicleGpsTracker(TenantMixin, Base):
    __tablename__ = "vehicle_gps_trackers"
    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "vehicle_id",
            name="uq_gps_tracker_company_vehicle",
        ),
    )

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

    tracking_token = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
        default=lambda: secrets.token_urlsafe(32),
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    last_seen_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="gps_tracker",
    )


# =========================================================
# GPS LOCATIONS
# =========================================================

class VehicleLocation(TenantMixin, Base):
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
    )

    vehicle = relationship(
        "Vehicle",
        back_populates="locations",
    )


# =========================================================
# DOCUMENT MANAGEMENT
# =========================================================

class TransportDocument(TenantMixin, Base):
    __tablename__ = "transport_documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    document_type = Column(
        String,
        nullable=False,
    )

    document_number = Column(
        String,
        default="",
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=True,
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=True,
    )

    issuing_authority = Column(
        String,
        default="",
    )

    issue_date = Column(
        Date,
        nullable=True,
    )

    expiry_date = Column(
        Date,
        nullable=True,
    )

    file_name = Column(
        String,
        default="",
    )

    stored_file_name = Column(
        String,
        default="",
    )

    file_url = Column(
        String,
        default="",
    )

    content_type = Column(
        String,
        default="",
    )

    file_size = Column(
        Integer,
        default=0,
    )

    notes = Column(
        String,
        default="",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    vehicle = relationship("Vehicle")
    driver = relationship("Driver")


# =========================================================
# NOTIFICATIONS
# =========================================================

class Notification(TenantMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "event_key",
            name="uq_notifications_company_event",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    notification_type = Column(
        String,
        default="General",
        nullable=False,
    )

    title = Column(
        String,
        nullable=False,
    )

    message = Column(
        String,
        default="",
    )

    priority = Column(
        String,
        default="Medium",
        nullable=False,
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=True,
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=True,
    )

    document_id = Column(
        Integer,
        ForeignKey("transport_documents.id"),
        nullable=True,
    )

    due_date = Column(
        Date,
        nullable=True,
    )

    action_url = Column(
        String,
        default="",
    )

    event_key = Column(
        String,
        index=True,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    read_at = Column(
        DateTime,
        nullable=True,
    )

    vehicle = relationship("Vehicle")
    driver = relationship("Driver")

    document = relationship(
        "TransportDocument"
    )

# =========================================================
# APPLICATION SETTINGS
# =========================================================

class AppSetting(TenantMixin, Base):
    __tablename__ = "app_settings"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_name = Column(
        String,
        default="TRANSPORT",
        nullable=False,
    )

    owner_name = Column(
        String,
        default="",
    )

    phone = Column(
        String,
        default="",
    )

    email = Column(
        String,
        default="",
    )

    address = Column(
        String,
        default="",
    )

    currency = Column(
        String,
        default="INR",
        nullable=False,
    )

    language = Column(
        String,
        default="en",
        nullable=False,
    )

    ai_voice = Column(
        String,
        default="Charon",
        nullable=False,
    )

    email_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    push_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    maintenance_alerts = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    document_alerts = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    theme = Column(
        String,
        default="light",
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
