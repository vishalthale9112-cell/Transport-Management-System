from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


# =========================================================
# VEHICLE
# =========================================================

class VehicleBrief(BaseModel):
    id: int
    registration_number: str

    class Config:
        from_attributes = True


# =========================================================
# DRIVER
# =========================================================

class DriverOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    photo_url: Optional[str] = ""
    license_number: Optional[str] = ""

    vehicles: list[VehicleBrief] = Field(
        default_factory=list
    )

    class Config:
        from_attributes = True


class DriverCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    photo_url: Optional[str] = ""
    license_number: Optional[str] = ""


# =========================================================
# VEHICLE
# =========================================================

class VehicleOut(BaseModel):
    id: int
    registration_number: str
    vehicle_type: str
    fuel_type: str
    status: str
    latitude: float
    longitude: float
    trip_progress: int
    service_due_in_days: int

    driver: Optional[DriverOut] = None

    class Config:
        from_attributes = True


class VehicleCreate(BaseModel):
    registration_number: str
    vehicle_type: str = "Truck"
    fuel_type: str = "Diesel"
    status: str = "Active"

    latitude: float = 19.0760
    longitude: float = 72.8777

    driver_id: Optional[int] = None

    service_due_in_days: int = 30


# =========================================================
# ORDER
# =========================================================

class OrderOut(BaseModel):
    id: int
    order_code: str
    customer_name: str
    status: str
    amount: float
    created_at: Optional[date] = None

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    order_code: str
    customer_name: str
    status: str = "Pending"
    amount: float = 0


# =========================================================
# TRIP
# =========================================================

class TripCreate(BaseModel):
    vehicle_id: int
    origin: str
    destination: str

    progress: int = 0
    status: str = "Ongoing"


class TripOut(BaseModel):
    id: int
    vehicle_id: int
    origin: str
    destination: str

    progress: int
    status: str

    class Config:
        from_attributes = True


# =========================================================
# ALERT
# =========================================================

class AlertOut(BaseModel):
    id: int
    title: str
    severity: str
    minutes_ago: int

    class Config:
        from_attributes = True


# =========================================================
# MONTHLY FINANCE
# =========================================================

class MonthlyFinanceOut(BaseModel):
    month: str
    revenue: float
    expenses: float

    class Config:
        from_attributes = True


# =========================================================
# DASHBOARD
# =========================================================

class DashboardStats(BaseModel):
    total_vehicles: int
    active_trips: int
    total_drivers: int
    pending_orders: int

    monthly_finance: list[MonthlyFinanceOut]

    fuel_breakdown: dict

    cost_per_km: dict

    alerts: list[AlertOut]

# =========================================================
# FUEL LOG
# =========================================================

class FuelLogCreate(BaseModel):
    vehicle_id: int
    fuel_type: str = "Diesel"
    liters: float
    price_per_liter: float
    total_cost: Optional[float] = None
    odometer: int = 0
    station_name: Optional[str] = ""
    date: date


class FuelLogOut(BaseModel):
    id: int
    vehicle_id: int
    fuel_type: str
    liters: float
    price_per_liter: float
    total_cost: float
    odometer: int
    station_name: Optional[str] = ""
    date: date

    class Config:
        from_attributes = True

class MaintenanceRecordCreate(BaseModel):
    vehicle_id: int
    service_type: str
    brand: Optional[str] = ""
    driver_name: Optional[str] = ""
    cost: float = 0
    next_due_days: int = 30


class MaintenanceRecordOut(BaseModel):
    id: int
    vehicle_id: int
    service_type: str
    brand: Optional[str] = ""
    driver_name: Optional[str] = ""
    cost: float
    next_due_days: int
    date: date

    class Config:
        from_attributes = True