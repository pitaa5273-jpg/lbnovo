"""
LB Mecânica Automotiva — Backend FastAPI
PostgreSQL (JSONB) + JWT + Cloudinary + CORS aberto.

Endpoints (sem /api prefix — match com o frontend):
  POST /login
  GET  /                       (health)
  GET/POST/PUT/DELETE /clientes
  GET/POST/PUT/DELETE /veiculos
  GET/POST/PUT/DELETE /os
  GET/POST/PUT/DELETE /servicos
  GET/POST/PUT/DELETE /pecas
  GET/POST/PUT/DELETE /orcamentos
  GET/POST/PUT/DELETE /financeiro
  GET/POST/PUT/DELETE /garantias
  POST /upload                 (multipart/form-data: file + tipo)
"""

from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import jwt
import cloudinary
import cloudinary.uploader
from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import Column, String, DateTime, select, delete
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
DATABASE_URL = os.environ["DATABASE_URL"]
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.environ.get("JWT_EXPIRE_HOURS", "24"))

ADMIN_USER = os.environ.get("ADMIN_USER", "lbmecanica")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "eaixuxu")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")

# Cloudinary é opcional — se não configurado, /upload retorna 503 com mensagem
CLOUDINARY_CONFIGURED = all([
    os.environ.get("CLOUDINARY_CLOUD_NAME"),
    os.environ.get("CLOUDINARY_API_KEY"),
    os.environ.get("CLOUDINARY_API_SECRET"),
])
if CLOUDINARY_CONFIGURED:
    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
        secure=True,
    )

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("lb-backend")

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()


def make_resource_model(table_name: str):
    """Gera um modelo SQLAlchemy genérico (id UUID + data JSONB) por recurso."""
    return type(
        table_name.capitalize(),
        (Base,),
        {
            "__tablename__": table_name,
            "id": Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            "data": Column(JSONB, nullable=False, default=dict),
            "created_at": Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)),
            "updated_at": Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                                 onupdate=lambda: datetime.now(timezone.utc)),
        },
    )


RESOURCES = ["clientes", "veiculos", "os", "servicos", "pecas",
             "orcamentos", "financeiro", "garantias"]
MODELS: Dict[str, Any] = {name: make_resource_model(name) for name in RESOURCES}


async def get_db():
    async with SessionLocal() as session:
        yield session


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Database ready. Tables: %s", ", ".join(RESOURCES))
    yield
    await engine.dispose()


# -----------------------------------------------------------------------------
# JWT helpers
# -----------------------------------------------------------------------------
def create_jwt(subject: str) -> str:
    payload = {
        "sub": subject,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


async def auth_required(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    payload = verify_jwt(auth[7:])
    sub = payload.get("sub")
    if sub != ADMIN_USER:
        raise HTTPException(status_code=401, detail="Usuário inválido")
    return sub


# -----------------------------------------------------------------------------
# Schemas
# -----------------------------------------------------------------------------
class LoginIn(BaseModel):
    usuario: str
    senha: str


class LoginOut(BaseModel):
    token: str
    user: str


# -----------------------------------------------------------------------------
# App
# -----------------------------------------------------------------------------
app = FastAPI(title="LB Mecânica Automotiva — API", version="1.0.0", lifespan=lifespan)

# CORS permissivo: se FRONTEND_URL for vazio, "*", "'*'", ou contiver "*",
# libera tudo via regex. Caso contrário, lista os domínios explicitamente.
_raw_origins = (FRONTEND_URL or "*").strip().strip('"').strip("'")
if not _raw_origins or "*" in _raw_origins:
    cors_kwargs = {"allow_origin_regex": ".*"}
else:
    cors_kwargs = {"allow_origins": [o.strip() for o in _raw_origins.split(",") if o.strip()]}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,  # usamos Bearer token, não cookies
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
    **cors_kwargs,
)


# -----------------------------------------------------------------------------
# Helpers de serialização
# -----------------------------------------------------------------------------
def to_dict(row) -> Dict[str, Any]:
    """Mescla o JSONB com o id e timestamps."""
    base = dict(row.data or {})
    base["id"] = str(row.id)
    if row.created_at:
        base.setdefault("createdAt", row.created_at.isoformat())
    if row.updated_at:
        base["updatedAt"] = row.updated_at.isoformat()
    return base


def normalize_payload(payload: Dict[str, Any], existing_id: Optional[str] = None) -> Dict[str, Any]:
    """Remove campos controlados pelo backend antes de salvar no JSONB."""
    out = dict(payload or {})
    out.pop("id", None)
    out.pop("createdAt", None)
    out.pop("updatedAt", None)
    return out


# -----------------------------------------------------------------------------
# Auth
# -----------------------------------------------------------------------------
@app.post("/login", response_model=LoginOut)
async def login(body: LoginIn):
    if body.usuario != ADMIN_USER or body.senha != ADMIN_PASS:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_jwt(ADMIN_USER)
    return LoginOut(token=token, user=ADMIN_USER)


@app.get("/")
async def health():
    return {
        "service": "LB Mecânica Automotiva API",
        "status": "ok",
        "cloudinary": CLOUDINARY_CONFIGURED,
        "now": datetime.now(timezone.utc).isoformat(),
    }


# -----------------------------------------------------------------------------
# CRUD genérico para todos os recursos
# -----------------------------------------------------------------------------
def register_crud(resource: str):
    Model = MODELS[resource]
    base = f"/{resource}"

    @app.get(base, dependencies=[Depends(auth_required)])
    async def list_items(db: AsyncSession = Depends(get_db)):
        result = await db.execute(select(Model).order_by(Model.created_at.desc()))
        return [to_dict(r) for r in result.scalars().all()]

    @app.get(f"{base}/{{item_id}}", dependencies=[Depends(auth_required)])
    async def get_item(item_id: str, db: AsyncSession = Depends(get_db)):
        try:
            uuid_id = uuid.UUID(item_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="ID inválido")
        result = await db.execute(select(Model).where(Model.id == uuid_id))
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Não encontrado")
        return to_dict(row)

    @app.post(base, dependencies=[Depends(auth_required)])
    async def create_item(payload: Dict[str, Any], db: AsyncSession = Depends(get_db)):
        obj = Model(id=uuid.uuid4(), data=normalize_payload(payload))
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return to_dict(obj)

    @app.put(f"{base}/{{item_id}}", dependencies=[Depends(auth_required)])
    async def update_item(item_id: str, payload: Dict[str, Any], db: AsyncSession = Depends(get_db)):
        try:
            uuid_id = uuid.UUID(item_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="ID inválido")
        result = await db.execute(select(Model).where(Model.id == uuid_id))
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Não encontrado")
        merged = {**(row.data or {}), **normalize_payload(payload)}
        row.data = merged
        await db.commit()
        await db.refresh(row)
        return to_dict(row)

    @app.delete(f"{base}/{{item_id}}", dependencies=[Depends(auth_required)])
    async def delete_item(item_id: str, db: AsyncSession = Depends(get_db)):
        try:
            uuid_id = uuid.UUID(item_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="ID inválido")
        await db.execute(delete(Model).where(Model.id == uuid_id))
        await db.commit()
        return {"id": item_id, "deleted": True}


for _r in RESOURCES:
    register_crud(_r)


# -----------------------------------------------------------------------------
# Upload (Cloudinary direct)
# -----------------------------------------------------------------------------
@app.post("/upload", dependencies=[Depends(auth_required)])
async def upload_file(file: UploadFile = File(...), tipo: str = Form("manutencao")):
    if not CLOUDINARY_CONFIGURED:
        raise HTTPException(
            status_code=503,
            detail="Cloudinary não configurado no backend. Defina CLOUDINARY_* nas variáveis de ambiente.",
        )
    folder = f"lb-mecanica/{tipo or 'manutencao'}"
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="auto",
        )
    except Exception as e:
        log.exception("Falha no upload Cloudinary")
        raise HTTPException(status_code=500, detail=f"Falha no upload: {e}")
    return {
        "url": result.get("secure_url"),
        "public_id": result.get("public_id"),
        "name": file.filename,
        "tipo": tipo,
        "bytes": result.get("bytes"),
        "format": result.get("format"),
        "width": result.get("width"),
        "height": result.get("height"),
    }


# -----------------------------------------------------------------------------
# Erros amigáveis
# -----------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exc_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
