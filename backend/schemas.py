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
    customer_name: str
    status: str = "Pending"
    amount: float = 0
    created_at: Optional[date] = None


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[float] = None
    created_at: Optional[date] = None


class OrderOut(BaseModel):
    id: int
    order_code: str
    customer_name: str
    status: str
    amount: float
    created_at: Optional[date] = None

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