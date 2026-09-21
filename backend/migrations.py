"""Small idempotent migrations for existing TMS installations."""

from datetime import datetime

from sqlalchemy import inspect, text


TENANT_TABLES = (
    "drivers",
    "vehicles",
    "customers",
    "orders",
    "trips",
    "monthly_finance",
    "income_records",
    "alerts",
    "fuel_logs",
    "maintenance_records",
    "expense_records",
    "vehicle_gps_trackers",
    "vehicle_locations",
    "transport_documents",
    "notifications",
    "app_settings",
)


def ensure_tenant_schema(engine) -> None:
    """Move all old rows into the initial THALE TRANSPORT workspace."""

    with engine.begin() as connection:
        existing_company_id = connection.execute(
            text(
                "SELECT id FROM companies "
                "WHERE slug = :slug ORDER BY id LIMIT 1"
            ),
            {"slug": "thale-transport"},
        ).scalar()

        if existing_company_id is None:
            connection.execute(
                text(
                    "INSERT INTO companies "
                    "(name, slug, is_active, created_at) "
                    "VALUES (:name, :slug, :is_active, :created_at)"
                ),
                {
                    "name": "THALE TRANSPORT",
                    "slug": "thale-transport",
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                },
            )

            existing_company_id = connection.execute(
                text(
                    "SELECT id FROM companies "
                    "WHERE slug = :slug ORDER BY id LIMIT 1"
                ),
                {"slug": "thale-transport"},
            ).scalar_one()

    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    dialect = engine.dialect.name

    for table_name in TENANT_TABLES:
        if table_name not in table_names:
            continue

        columns = {
            column["name"]
            for column in inspect(engine).get_columns(table_name)
        }

        with engine.begin() as connection:
            if "company_id" not in columns:
                foreign_key_sql = (
                    " REFERENCES companies(id)"
                    if dialect == "postgresql"
                    else ""
                )
                connection.execute(
                    text(
                        f'ALTER TABLE "{table_name}" '
                        f"ADD COLUMN company_id INTEGER "
                        f"DEFAULT {int(existing_company_id)}"
                        f"{foreign_key_sql}"
                    )
                )

            connection.execute(
                text(
                    f'UPDATE "{table_name}" '
                    "SET company_id = :company_id "
                    "WHERE company_id IS NULL"
                ),
                {"company_id": existing_company_id},
            )

            if dialect == "postgresql":
                connection.execute(
                    text(
                        f'ALTER TABLE "{table_name}" '
                        "ALTER COLUMN company_id SET NOT NULL"
                    )
                )
                connection.execute(
                    text(
                        f'ALTER TABLE "{table_name}" '
                        "ALTER COLUMN company_id DROP DEFAULT"
                    )
                )

            connection.execute(
                text(
                    f"CREATE INDEX IF NOT EXISTS "
                    f'ix_{table_name}_company_id ON "{table_name}" '
                    "(company_id)"
                )
            )
