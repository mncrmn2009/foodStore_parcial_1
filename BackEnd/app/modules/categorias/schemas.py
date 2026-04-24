from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime

# Entrada

class CategoriaCreate(SQLModel):
    """Body para el POST /categorias/"""
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str]= None
    imagen_url: Optional[str] =None
    parent_id: Optional[int] = None

class CategoriaUpdate(SQLModel):
    """Body para PATCH /categorias/{id} - Todos son opcionales"""
    nombre: Optional[str] = Field(default= None, min_length=2, max_length=100)
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    parent_id: Optional[int] = None

# Salida

class CategoriaPublic(SQLModel):
    """Response model: campos que se exponen al cliente"""
    id:int
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None

class CategoriaList(SQLModel):
    """Response model paginado para GET /categorias/"""
    data: List[CategoriaPublic]
    total: int