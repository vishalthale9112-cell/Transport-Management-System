"""Supabase authentication and verified company membership dependencies."""

import os
import re
from dataclasses import dataclass
from functools import lru_cache

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy.orm import Session

import models
from database import SessionLocal, get_db
from tenancy import set_session_company


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: str
    email: str


@dataclass(frozen=True)
class TenantContext:
    user_id: str
    email: str
    company_id: int
    company_name: str
    role: str


def _unauthorized(detail: str = "Login required") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    if not supabase_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_URL is not configured",
        )

    return PyJWKClient(
        f"{supabase_url}/auth/v1/.well-known/jwks.json",
        cache_keys=True,
    )


def _decode_access_token(token: str) -> dict:
    audience = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()

    try:
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get("alg", "")

        if algorithm == "HS256":
            if not jwt_secret:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="SUPABASE_JWT_SECRET is not configured",
                )

            signing_key = jwt_secret
            algorithms = ["HS256"]
        elif algorithm in {"RS256", "ES256"}:
            signing_key = _jwks_client().get_signing_key_from_jwt(token).key
            algorithms = [algorithm]
        else:
            raise _unauthorized("Unsupported login token")

        return jwt.decode(
            token,
            signing_key,
            algorithms=algorithms,
            audience=audience,
            options={"require": ["exp", "sub"]},
        )
    except HTTPException:
        raise
    except Exception as error:
        raise _unauthorized("Login session is invalid or expired") from error


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> AuthenticatedUser:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise _unauthorized()

    claims = _decode_access_token(credentials.credentials)
    user_id = str(claims.get("sub", "")).strip()
    email = str(claims.get("email", "")).strip().lower()

    if not user_id:
        raise _unauthorized("Login token has no user identity")

    return AuthenticatedUser(user_id=user_id, email=email)


def get_tenant_context(
    user: AuthenticatedUser = Depends(get_current_user),
    requested_company_id: int | None = Header(
        default=None,
        alias="X-Company-ID",
    ),
    db: Session = Depends(get_db),
) -> TenantContext:
    query = (
        db.query(models.CompanyMember)
        .join(models.Company)
        .filter(
            models.CompanyMember.user_id == user.user_id,
            models.CompanyMember.is_active.is_(True),
            models.Company.is_active.is_(True),
        )
    )

    if requested_company_id is not None:
        query = query.filter(
            models.CompanyMember.company_id == requested_company_id
        )

    membership = query.order_by(models.CompanyMember.id.asc()).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "WORKSPACE_REQUIRED",
                "message": "Create or join a company workspace first",
            },
        )

    return TenantContext(
        user_id=user.user_id,
        email=user.email,
        company_id=membership.company_id,
        company_name=membership.company.name,
        role=membership.role,
    )


def get_tenant_db(
    context: TenantContext = Depends(get_tenant_context),
):
    db = SessionLocal()
    set_session_company(db, context.company_id)

    try:
        yield db
    finally:
        db.close()


def create_company_slug(db: Session, company_name: str) -> str:
    base_slug = re.sub(
        r"[^a-z0-9]+",
        "-",
        company_name.lower(),
    ).strip("-") or "company"

    candidate = base_slug
    suffix = 2

    while (
        db.query(models.Company)
        .filter(models.Company.slug == candidate)
        .first()
    ):
        candidate = f"{base_slug}-{suffix}"
        suffix += 1

    return candidate
