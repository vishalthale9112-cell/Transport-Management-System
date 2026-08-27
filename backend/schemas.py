from pydantic import BaseModel
from typing import Optional
from datetime import date


class VehicleBrief(BaseModel):
    id: int
    registration_number: str

    class Config:
        from_attributes = True


class DriverOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    photo_url: Optional[str] = ""
    license_number: Optional[str] = ""
    vehicles: list[VehicleBrief] = []

    class Config:
        from_attributes = True


class DriverCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    photo_url: Optional[str] = ""
    license_number: Optional[str] = ""


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


class AlertOut(BaseModel):
    id: int
    title: str
    severity: str
    minutes_ago: int

    class Config:
        from_attributes = True


class MonthlyFinanceOut(BaseModel):
    month: str
    revenue: float
    expenses: float

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_vehicles: int
    active_trips: int
    total_drivers: int
    pending_orders: int
    monthly_finance: list[MonthlyFinanceOut]
    fuel_breakdown: dict
    cost_per_km: dict
    alerts: list[AlertOut]
