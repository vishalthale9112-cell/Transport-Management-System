"""SQLAlchemy safeguards that enforce company data isolation."""

from sqlalchemy import event, select
from sqlalchemy.orm import Session, with_loader_criteria

import models


class TenantAccessError(RuntimeError):
    """Raised when a session tries to touch another company's row."""


TENANT_FOREIGN_KEYS = {
    models.Vehicle: {
        "driver_id": models.Driver,
    },
    models.Order: {
        "customer_id": models.Customer,
        "vehicle_id": models.Vehicle,
    },
    models.Trip: {
        "vehicle_id": models.Vehicle,
    },
    models.IncomeRecord: {
        "customer_id": models.Customer,
        "order_id": models.Order,
        "vehicle_id": models.Vehicle,
    },
    models.FuelLog: {
        "vehicle_id": models.Vehicle,
    },
    models.MaintenanceRecord: {
        "vehicle_id": models.Vehicle,
    },
    models.ExpenseRecord: {
        "vehicle_id": models.Vehicle,
        "driver_id": models.Driver,
    },
    models.VehicleGpsTracker: {
        "vehicle_id": models.Vehicle,
    },
    models.VehicleLocation: {
        "vehicle_id": models.Vehicle,
    },
    models.TransportDocument: {
        "vehicle_id": models.Vehicle,
        "driver_id": models.Driver,
    },
    models.Notification: {
        "vehicle_id": models.Vehicle,
        "driver_id": models.Driver,
        "document_id": models.TransportDocument,
    },
}


def set_session_company(db: Session, company_id: int) -> None:
    """Bind a database session to one verified company."""

    db.info["company_id"] = int(company_id)


@event.listens_for(Session, "do_orm_execute")
def add_company_filter(execute_state):
    """Automatically add company_id to every tenant-owned ORM query."""

    company_id = execute_state.session.info.get("company_id")
    if company_id is None:
        return

    if not (
        execute_state.is_select
        or execute_state.is_update
        or execute_state.is_delete
    ):
        return

    execute_state.statement = execute_state.statement.options(
        with_loader_criteria(
            models.TenantMixin,
            lambda model: model.company_id == company_id,
            include_aliases=True,
        )
    )


@event.listens_for(Session, "before_flush")
def stamp_and_validate_company(session, _flush_context, _instances):
    """Stamp new rows and reject cross-company writes/deletes."""

    company_id = session.info.get("company_id")
    if company_id is None:
        return

    for row in session.new:
        if not isinstance(row, models.TenantMixin):
            continue

        if row.company_id is None:
            row.company_id = company_id
        elif row.company_id != company_id:
            raise TenantAccessError(
                "Cannot create data for another company"
            )

    for row in (*session.dirty, *session.deleted):
        if not isinstance(row, models.TenantMixin):
            continue

        if row.company_id != company_id:
            raise TenantAccessError(
                "Cannot change data owned by another company"
            )

    for row in (*session.new, *session.dirty):
        foreign_keys = TENANT_FOREIGN_KEYS.get(type(row), {})

        for field_name, target_model in foreign_keys.items():
            target_id = getattr(row, field_name, None)
            if target_id is None:
                continue

            target_company_id = session.execute(
                select(target_model.company_id).where(
                    target_model.id == target_id
                )
            ).scalar_one_or_none()

            if target_company_id != company_id:
                raise TenantAccessError(
                    f"{field_name} does not belong to this company"
                )
