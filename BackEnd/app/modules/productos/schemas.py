# app/modules/productos/schemas.py
from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime

# ── Entrada ───────────────────────────────────────────────────────────────────

class ProductoCreate(SQLModel):
    """Body para POST /productos/"""
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: Optional[str] = None
    precio: float = Field(ge=0.0) # ge=0.0 asegura que no envíen precios negativos
    stock: int = Field(default=0, ge=0)
    imagen_url: Optional[str] = None
    
    # El cliente enviará una lista de IDs para vincular el producto a categorías
    categoria_ids: List[int] = Field(default_factory=list)
    ingrediente_ids: List[int] = Field(default_factory=list)


class ProductoUpdate(SQLModel):
    """Body para PATCH /productos/{id} — todos los campos opcionales."""
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=150)
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(default=None, ge=0.0)
    stock: Optional[int] = Field(default=None, ge=0)
    imagen_url: Optional[str] = None
    
    # Si se envía una lista, reemplazará las categorías actuales del producto
    categoria_ids: Optional[List[int]] = None
    ingrediente_ids: Optional[List[int]] = None


# ── Salida ────────────────────────────────────────────────────────────────────

class IngredienteBasica(SQLModel):
    """Schema reducido de ingrediente para anidarlo en ProductoPublic."""
    id: int
    nombre: str

class CategoriaBasica(SQLModel):
    id:int
    nombre: str

class ProductoPublic(SQLModel):
    """Response model: campos que se exponen al cliente."""
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int = 0
    imagen_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Exponemos las listas de objetos relacionados
    categorias: List[CategoriaBasica] = Field(default_factory=list)
    ingredientes: List[IngredienteBasica] = Field(default_factory=list)


class ProductoList(SQLModel):
    """Response model paginado para GET /productos/"""
    data: List[ProductoPublic]
    total: int