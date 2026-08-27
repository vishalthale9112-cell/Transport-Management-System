from datetime import date
from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

db = SessionLocal()

if db.query(models.Driver).count() == 0:
    drivers = [
        models.Driver(name="Rahul Singh", phone="+91 98765 43210", license_number="MH01-2020-0012345"),
        models.Driver(name="Thanya Yog", phone="+91 90210 43221", license_number="MH02-2019-0054321"),
        models.Driver(name="Suresh Patil", phone="+91 91234 56789", license_number="MH03-2021-0098765"),
        models.Driver(name="Ganesh More", phone="+91 99887 76655", license_number="MH04-2018-0011223"),
    ]
    db.add_all(drivers)
    db.commit()

    vehicles = [
        models.Vehicle(registration_number="KA01XY1454", vehicle_type="Truck", fuel_type="Diesel",
                        status="Active", latitude=19.0760, longitude=72.8777, trip_progress=75,
                        driver_id=drivers[0].id, service_due_in_days=45),
        models.Vehicle(registration_number="MH12AB3456", vehicle_type="Truck", fuel_type="Diesel",
                        status="Active", latitude=19.2183, longitude=72.9781, trip_progress=40,
                        driver_id=drivers[1].id, service_due_in_days=3),
        models.Vehicle(registration_number="MH14CD5678", vehicle_type="Van", fuel_type="Petrol",
                        status="Maintenance", latitude=18.9750, longitude=72.8258, trip_progress=0,
                        driver_id=drivers[2].id, service_due_in_days=0),
        models.Vehicle(registration_number="MH04EF9012", vehicle_type="Truck", fuel_type="CNG",
                        status="Active", latitude=19.1136, longitude=72.8697, trip_progress=90,
                        driver_id=drivers[3].id, service_due_in_days=60),
        models.Vehicle(registration_number="MH20GH3344", vehicle_type="Van", fuel_type="Diesel",
                        status="Idle", latitude=18.5204, longitude=73.8567, trip_progress=0,
                        driver_id=None, service_due_in_days=20),
    ]
    db.add_all(vehicles)
    db.commit()

    orders = [
        models.Order(order_code="REE123", customer_name="Reliance Logistics", status="New", amount=45000, created_at=date.today()),
        models.Order(order_code="TAT456", customer_name="Tata Steel", status="In Transit", amount=120000, created_at=date.today()),
        models.Order(order_code="ADN789", customer_name="Adani Ports", status="Delivered", amount=78000, created_at=date.today()),
        models.Order(order_code="BAJ321", customer_name="Bajaj Auto", status="Pending", amount=32000, created_at=date.today()),
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
        models.Alert(title="New Order: REE123 from Reliance Logistics", severity="info", minutes_ago=27),
        models.Alert(title="Alert: Vehicle MH14CD5678 Service Due in 3 days", severity="warning", minutes_ago=27),
        models.Alert(title="Insurance Expiring Soon for GJ02EF2012", severity="warning", minutes_ago=27),
        models.Alert(title="Vehicle MH14CD5678 Service Due", severity="critical", minutes_ago=27),
    ]
    db.add_all(alerts)
    db.commit()

    print("Seed data inserted.")
else:
    print("Data already exists, skipping seed.")

db.close()
