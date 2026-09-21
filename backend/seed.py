from datetime import date
from database import SessionLocal, engine, Base
import models
from migrations import ensure_tenant_schema
from tenancy import set_session_company

Base.metadata.create_all(bind=engine)
ensure_tenant_schema(engine)

db = SessionLocal()
default_company = (
    db.query(models.Company)
    .filter(models.Company.slug == "thale-transport")
    .one()
)
set_session_company(db, default_company.id)

if db.query(models.Driver).count() == 0:
    drivers = [
        models.Driver(name="Demo Driver 1"),
        models.Driver(name="Demo Driver 2"),
        models.Driver(name="Demo Driver 3"),
        models.Driver(name="Demo Driver 4"),
    ]
    db.add_all(drivers)
    db.commit()

    vehicles = [
        models.Vehicle(registration_number="DEMO-VEH-001", vehicle_type="Truck", fuel_type="Diesel",
                        status="Active", latitude=0, longitude=0, trip_progress=75,
                        driver_id=drivers[0].id, service_due_in_days=45),
        models.Vehicle(registration_number="DEMO-VEH-002", vehicle_type="Truck", fuel_type="Diesel",
                        status="Active", latitude=0, longitude=0, trip_progress=40,
                        driver_id=drivers[1].id, service_due_in_days=3),
        models.Vehicle(registration_number="DEMO-VEH-003", vehicle_type="Van", fuel_type="Petrol",
                        status="Maintenance", latitude=0, longitude=0, trip_progress=0,
                        driver_id=drivers[2].id, service_due_in_days=0),
        models.Vehicle(registration_number="DEMO-VEH-004", vehicle_type="Truck", fuel_type="CNG",
                        status="Active", latitude=0, longitude=0, trip_progress=90,
                        driver_id=drivers[3].id, service_due_in_days=60),
        models.Vehicle(registration_number="DEMO-VEH-005", vehicle_type="Van", fuel_type="Diesel",
                        status="Idle", latitude=0, longitude=0, trip_progress=0,
                        driver_id=None, service_due_in_days=20),
    ]
    db.add_all(vehicles)
    db.commit()

    orders = [
        models.Order(order_code="DEMO-001", customer_name="Demo Customer 1", status="New", amount=45000, created_at=date.today()),
        models.Order(order_code="DEMO-002", customer_name="Demo Customer 2", status="In Transit", amount=120000, created_at=date.today()),
        models.Order(order_code="DEMO-003", customer_name="Demo Customer 3", status="Delivered", amount=78000, created_at=date.today()),
        models.Order(order_code="DEMO-004", customer_name="Demo Customer 4", status="Pending", amount=32000, created_at=date.today()),
    ]
    db.add_all(orders)
    db.commit()

    finance = [
        models.MonthlyFinance(month="Jan", revenue=850000, expenses=520000),
        models.MonthlyFinance(month="Feb", revenue=920000, expenses=560000),
        models.MonthlyFinance(month="Mar", revenue=880000, expenses=540000),
        models.MonthlyFinance(month="Apr", revenue=1010000, expenses=610000),
        models.MonthlyFinance(month="May", revenue=970000, expenses=580000),
        models.MonthlyFinance(month="Jun", revenue=1100000, expenses=650000),
        models.MonthlyFinance(month="Jul", revenue=1050000, expenses=630000),
        models.MonthlyFinance(month="Aug", revenue=1180000, expenses=690000),
        models.MonthlyFinance(month="Sep", revenue=1120000, expenses=660000),
        models.MonthlyFinance(month="Oct", revenue=1250000, expenses=720000),
        models.MonthlyFinance(month="Nov", revenue=1200000, expenses=700000),
        models.MonthlyFinance(month="Dec", revenue=1300000, expenses=760000),
    ]
    db.add_all(finance)
    db.commit()

    alerts = [
        models.Alert(title="New demo order received", severity="info", minutes_ago=27),
        models.Alert(title="Demo vehicle service due in 3 days", severity="warning", minutes_ago=27),
        models.Alert(title="Demo vehicle insurance expiring soon", severity="warning", minutes_ago=27),
        models.Alert(title="Demo vehicle service due", severity="critical", minutes_ago=27),
    ]
    db.add_all(alerts)
    db.commit()

    print("Seed data inserted.")
else:
    print("Data already exists, skipping seed.")

db.close()
