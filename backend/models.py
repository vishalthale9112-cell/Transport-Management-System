from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    photo_url = Column(String, default="")
    license_number = Column(String, default="")

    vehicles = relationship("Vehicle", back_populates="driver")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, default="Truck")
    fuel_type = Column(String, default="Diesel")
    status = Column(String, default="Active")  # Active, Maintenance, Idle
    latitude = Column(Float, default=19.0760)
    longitude = Column(Float, default=72.8777)
    trip_progress = Column(Integer, default=0)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    service_due_in_days = Column(Integer, default=30)
    insurance_expiry = Column(Date, nullable=True)

    driver = relationship("Driver", back_populates="vehicles")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String, unique=True, nullable=False)
    customer_name = Column(String, nullable=False)
    status = Column(String, default="Pending")
    amount = Column(Float, default=0)
    created_at = Column(Date)


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    origin = Column(String)
    destination = Column(String)
    progress = Column(Integer, default=0)
    status = Column(String, default="Ongoing")


class MonthlyFinance(Base):
    __tablename__ = "monthly_finance"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, nullable=False)
    revenue = Column(Float, default=0)
    expenses = Column(Float, default=0)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    severity = Column(String, default="info")  # info, warning, critical
    minutes_ago = Column(Integer, default=0)

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    fuel_type = Column(
        String,
        default="Diesel",
        nullable=False
    )

    liters = Column(Float, nullable=False)

    price_per_liter = Column(
        Float,
        nullable=False
    )

    total_cost = Column(
        Float,
        nullable=False
    )

    odometer = Column(
        Integer,
        default=0
    )

    station_name = Column(
        String,
        default=""
    )

    date = Column(
        Date,
        nullable=False
    )

    vehicle = relationship("Vehicle")
