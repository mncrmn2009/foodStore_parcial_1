# app/modules/ingredientes/models.py

from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone

from app.modules.productos.models import ProductoIngrediente

# Evitamos importaciones circulares
if TYPE_CHECKING:
    from app.modules.productos.models import Producto


# 1. EL MODELO DE INGREDIENTE
class Ingrediente(SQLModel, table=True):
    """Tabla ingredientes en la base de datos."""
    __tablename__ = "ingredientes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=150, unique=True, index=True)
    
    # Auditoría y Borrado lógico
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None

    # --- Relaciones ORM ---
    productos: List["Producto"] = Relationship(
        back_populates="ingredientes", 
        link_model= ProductoIngrediente
    )