from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# DRIVER SCHEMAS
# =========================================================

class DriverCreate(BaseModel):
    name: str
    phone: str = ""
    photo_url: str = ""
    license_number: str = ""


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    license_number: Optional[str] = None


class DriverOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = ""
    photo_url: Optional[str] = ""
    license_number: Optional[str] = ""

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# VEHICLE SCHEMAS
# =========================================================

class VehicleCreate(BaseModel):
    registration_number: str
    vehicle_type: str = "Truck"
    fuel_type: str = "Diesel"
    status: str = "Active"

    latitude: float = 19.0760
    longitude: float = 72.8777
    trip_progress: int = 0

    driver_id: Optional[int] = None
    service_due_in_days: int = 30
    insurance_expiry: Optional[date] = None


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    fuel_type: Optional[str] = None
    status: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    trip_progress: Optional[int] = None

    driver_id: Optional[int] = None
    service_due_in_days: Optional[int] = None
    insurance_expiry: Optional[date] = None


class VehicleOut(BaseModel):
    id: int
    registration_number: str
    vehicle_type: str
    fuel_type: str
    status: str

    latitude: float
    longitude: float
    trip_progress: int

    driver_id: Optional[int] = None
    service_due_in_days: int
    insurance_expiry: Optional[date] = None

    driver: Optional[DriverOut] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# ORDER SCHEMAS
# =========================================================

class OrderCreate(BaseModel):
    order_code: str
    customer_id: int
    customer_name: str = ""
    vehicle_id: int
    goods_name: str
    quantity: str = ""
    weight_kg: float = Field(default=0, ge=0)
    receiver_name: str
    receiver_phone: str
    origin: str
    destination: str
    status: str = "Pending"
    amount: float = Field(
        default=0,
        ge=0,
    )

    created_at: Optional[date] = None


class OrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    vehicle_id: Optional[int] = None
    goods_name: Optional[str] = None
    quantity: Optional[str] = None
    weight_kg: Optional[float] = Field(default=None, ge=0)
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[float] = Field(
        default=None,
        ge=0,
    )

    created_at: Optional[date] = None


class OrderOut(BaseModel):
    id: int
    order_code: str

    customer_id: Optional[int] = None
    customer_name: str
    vehicle_id: Optional[int] = None
    goods_name: str = ""
    quantity: str = ""
    weight_kg: float = 0
    receiver_name: str = ""
    receiver_phone: str = ""
    origin: str = ""
    destination: str = ""
    status: str
    amount: float
    created_at: Optional[date] = None

    vehicle: Optional[VehicleOut] = None

    model_config = ConfigDict(
        from_attributes=True,
    )

# =========================================================
# TRIP SCHEMAS
# =========================================================

class TripCreate(BaseModel):
    vehicle_id: int
    origin: str
    destination: str
    progress: int = Field(
        default=0,
        ge=0,
        le=100,
    )
    status: str = "Ongoing"


class TripUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None

    progress: Optional[int] = Field(
        default=None,
        ge=0,
        le=100,
    )

    status: Optional[str] = None


class TripOut(BaseModel):
    id: int
    vehicle_id: int
    origin: Optional[str] = ""
    destination: Optional[str] = ""
    progress: int
    status: str

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# MONTHLY FINANCE SCHEMAS
# =========================================================

class MonthlyFinanceCreate(BaseModel):
    month: str
    revenue: float = 0
    expenses: float = 0


class MonthlyFinanceOut(BaseModel):
    id: int
    month: str
    revenue: float
    expenses: float

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# ALERT SCHEMAS
# =========================================================

class AlertCreate(BaseModel):
    title: str
    severity: str = "info"
    minutes_ago: int = 0


class AlertOut(BaseModel):
    id: int
    title: str
    severity: str
    minutes_ago: int

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# FUEL LOG SCHEMAS
# =========================================================

class FuelLogCreate(BaseModel):
    vehicle_id: int
    fuel_type: str = "Diesel"

    liters: float = Field(
        ...,
        gt=0,
    )

    price_per_liter: float = Field(
        ...,
        gt=0,
    )

    odometer: int = Field(
        default=0,
        ge=0,
    )

    station_name: str = ""
    date: date


class FuelLogOut(BaseModel):
    id: int
    vehicle_id: int
    fuel_type: str

    liters: float
    price_per_liter: float
    total_cost: float

    odometer: int
    station_name: str
    date: date

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# MAINTENANCE SCHEMAS
# =========================================================

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    service_type: str
    brand: str = ""
    driver_name: str = ""

    cost: float = Field(
        default=0,
        ge=0,
    )

    next_due_days: int = Field(
        default=30,
        ge=0,
    )

    date: date


class MaintenanceUpdate(BaseModel):
    service_type: Optional[str] = None
    brand: Optional[str] = None
    driver_name: Optional[str] = None

    cost: Optional[float] = Field(
        default=None,
        ge=0,
    )

    next_due_days: Optional[int] = Field(
        default=None,
        ge=0,
    )

    date: Optional[date] = None


class MaintenanceOut(BaseModel):
    id: int
    vehicle_id: int
    service_type: str
    brand: str
    driver_name: str
    cost: float
    next_due_days: int
    date: date

    model_config = ConfigDict(
        from_attributes=True,
    )


# हे aliases existing main.py सोबत compatibility साठी आहेत
MaintenanceRecordCreate = MaintenanceCreate
MaintenanceRecordUpdate = MaintenanceUpdate
MaintenanceRecordOut = MaintenanceOut


# =========================================================
# GPS LOCATION UPDATE
# =========================================================

class GpsLocationUpdate(BaseModel):
    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
    )

    accuracy: Optional[float] = Field(
        default=None,
        ge=0,
    )

    # Mobile कडून kilometre per hour मध्ये speed येईल
    speed: Optional[float] = Field(
        default=None,
        ge=0,
    )

    heading: Optional[float] = Field(
        default=None,
        ge=0,
        le=360,
    )


# =========================================================
# GPS TRACKER RESPONSE
# =========================================================

class GpsTrackerOut(BaseModel):
    vehicle_id: int
    registration_number: str
    tracking_token: str
    is_active: bool
    driver_tracking_path: str

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# LATEST GPS LOCATION RESPONSE
# =========================================================

class GpsLatestLocationOut(BaseModel):
    vehicle_id: int
    registration_number: str

    latitude: float
    longitude: float

    accuracy: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None

    recorded_at: datetime
    gps_status: str

    # GPS history वरून calculate होणारी values
    today_km: float = 0
    estimated_fuel_liters: float = 0
    estimated_fuel_cost: float = 0
    mileage_kmpl: float = 0

    model_config = ConfigDict(
        from_attributes=True,
    )

# =========================================================
# GPS STATUS RESPONSE
# =========================================================

class GpsTrackingStatusOut(BaseModel):
    vehicle_id: int
    registration_number: str

    gps_status: str
    is_active: bool

    last_seen_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )

# =========================================================
# CUSTOMER SCHEMAS
# =========================================================

class CustomerCreate(BaseModel):
    name: str
    phone: str = ""
    email: str = ""

    company_name: str = ""
    gst_number: str = ""

    address: str = ""
    city: str = ""
    state: str = "Maharashtra"
    pincode: str = ""

    status: str = "Active"

    total_orders: int = Field(
        default=0,
        ge=0,
    )

    total_trips: int = Field(
        default=0,
        ge=0,
    )

    total_revenue: float = Field(
        default=0,
        ge=0,
    )

    paid_amount: float = Field(
        default=0,
        ge=0,
    )

    pending_amount: float = Field(
        default=0,
        ge=0,
    )


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    company_name: Optional[str] = None
    gst_number: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    status: Optional[str] = None

    total_orders: Optional[int] = Field(
        default=None,
        ge=0,
    )

    total_trips: Optional[int] = Field(
        default=None,
        ge=0,
    )

    total_revenue: Optional[float] = Field(
        default=None,
        ge=0,
    )

    paid_amount: Optional[float] = Field(
        default=None,
        ge=0,
    )

    pending_amount: Optional[float] = Field(
        default=None,
        ge=0,
    )


class CustomerOut(BaseModel):
    id: int

    name: str
    phone: str
    email: str

    company_name: str
    gst_number: str

    address: str
    city: str
    state: str
    pincode: str

    status: str

    total_orders: int
    total_trips: int

    total_revenue: float
    paid_amount: float
    pending_amount: float

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )



# =========================================================
# EXPENSE SCHEMAS
# =========================================================

class ExpenseCreate(BaseModel):
    category: str

    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None

    vendor_name: str = ""

    amount: float = Field(
        ...,
        gt=0,
    )

    expense_date: date

    payment_mode: str = "Cash"
    reference_number: str = ""
    status: str = "Paid"
    notes: str = ""


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    vendor_name: Optional[str] = None

    amount: Optional[float] = Field(
        default=None,
        gt=0,
    )

    expense_date: Optional[date] = None
    payment_mode: Optional[str] = None
    reference_number: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ExpenseOut(BaseModel):
    id: int
    category: str

    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None

    vendor_name: str
    amount: float
    expense_date: date
    payment_mode: str
    reference_number: str
    status: str
    notes: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# INCOME / PAYMENT SCHEMAS
# =========================================================

class IncomeCreate(BaseModel):
    customer_id: int
    order_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    amount: float = Field(..., gt=0)
    payment_mode: str = "Cash"
    payment_status: str = "Received"
    transaction_reference: str = ""
    notes: str = ""
    payment_date: date


class IncomeUpdate(BaseModel):
    customer_id: Optional[int] = None
    order_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    amount: Optional[float] = Field(default=None, gt=0)
    payment_mode: Optional[str] = None
    payment_status: Optional[str] = None
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    payment_date: Optional[date] = None


class IncomeOut(BaseModel):
    id: int
    customer_id: int
    order_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    amount: float
    payment_mode: str
    payment_status: str
    transaction_reference: str = ""
    notes: str = ""
    payment_date: date
    created_at: datetime

    customer: Optional[CustomerOut] = None
    order: Optional[OrderOut] = None
    vehicle: Optional[VehicleOut] = None
    

    model_config = ConfigDict(
        from_attributes=True,
    )

# =========================================================
# DOCUMENT MANAGEMENT SCHEMAS
# =========================================================

class DocumentCreate(BaseModel):
    document_type: str
    document_number: str = ""

    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None

    issuing_authority: str = ""
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: str = ""


class DocumentUpdate(BaseModel):
    document_type: Optional[str] = None
    document_number: Optional[str] = None

    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None

    issuing_authority: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None


class DocumentOut(BaseModel):
    id: int

    document_type: str
    document_number: str

    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None

    issuing_authority: str
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None

    file_name: str
    stored_file_name: str
    file_url: str
    content_type: str
    file_size: int

    notes: str
    created_at: datetime

    expiry_status: str = "No Expiry"
    days_remaining: Optional[int] = None

    vehicle: Optional[VehicleOut] = None
    driver: Optional[DriverOut] = None

    model_config = ConfigDict(
        from_attributes=True,
    )