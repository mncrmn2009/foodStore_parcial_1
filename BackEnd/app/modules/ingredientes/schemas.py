# app/modules/ingredientes/schemas.py
from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime

# ── Entrada ───────────────────────────────────────────────────────────────────

class IngredienteCreate(SQLModel):
    """Body para POST /ingredientes/"""
    nombre: str = Field(min_length=2, max_length=150)

class IngredienteUpdate(SQLModel):
    """Body para PATCH /ingredientes/{id}"""
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=150)

# ── Salida ────────────────────────────────────────────────────────────────────

class IngredientePublic(SQLModel):
    """Response model: campos que se exponen al cliente."""
    id: int
    nombre: str

class IngredienteList(SQLModel):
    """Response model paginado para GET /ingredientes/"""
    data: List[IngredientePublic]
    total: int