import sys
import unittest
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import models  # noqa: E402
import tenancy  # noqa: E402
from database import Base  # noqa: E402


class TenantIsolationTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

        db = self.Session()
        company_a = models.Company(name="A", slug="a")
        company_b = models.Company(name="B", slug="b")
        db.add_all([company_a, company_b])
        db.commit()
        self.company_a_id = company_a.id
        self.company_b_id = company_b.id
        db.close()

    def tearDown(self):
        self.engine.dispose()

    def tenant_session(self, company_id):
        db = self.Session()
        tenancy.set_session_company(db, company_id)
        return db

    def test_rows_are_stamped_and_reads_are_isolated(self):
        company_a = self.tenant_session(self.company_a_id)
        company_a.add(models.Driver(name="Driver A"))
        company_a.commit()
        company_a.close()

        company_b = self.tenant_session(self.company_b_id)
        company_b.add(models.Driver(name="Driver B"))
        company_b.commit()

        rows = company_b.query(models.Driver).all()
        self.assertEqual([row.name for row in rows], ["Driver B"])
        self.assertEqual(rows[0].company_id, self.company_b_id)
        company_b.close()

    def test_cross_company_insert_is_rejected(self):
        db = self.tenant_session(self.company_a_id)
        db.add(
            models.Driver(
                name="Blocked",
                company_id=self.company_b_id,
            )
        )

        with self.assertRaises(tenancy.TenantAccessError):
            db.commit()

        db.rollback()
        db.close()

    def test_bulk_delete_cannot_reach_another_company(self):
        company_a = self.tenant_session(self.company_a_id)
        company_a.add(models.Driver(name="Keep A"))
        company_a.commit()
        company_a.close()

        company_b = self.tenant_session(self.company_b_id)
        deleted = company_b.query(models.Driver).delete()
        company_b.commit()
        company_b.close()

        self.assertEqual(deleted, 0)

        company_a = self.tenant_session(self.company_a_id)
        self.assertEqual(company_a.query(models.Driver).count(), 1)
        company_a.close()

    def test_cross_company_foreign_key_is_rejected(self):
        company_a = self.tenant_session(self.company_a_id)
        vehicle = models.Vehicle(registration_number="MH-20-AA-1001")
        company_a.add(vehicle)
        company_a.commit()
        vehicle_id = vehicle.id
        company_a.close()

        company_b = self.tenant_session(self.company_b_id)
        company_b.add(
            models.Trip(
                vehicle_id=vehicle_id,
                origin="A",
                destination="B",
            )
        )

        with self.assertRaises(tenancy.TenantAccessError):
            company_b.commit()

        company_b.rollback()
        company_b.close()


if __name__ == "__main__":
    unittest.main()
