
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone
from app.modules.productos.models import ProductoCategoria

if TYPE_CHECKING:
    from app.modules.productos.models import Producto, ProductoCategoria

class Categoria(SQLModel, table= True):

    __tablename__ = "categorias"

    id: Optional[int] = Field(default=None, primary_key=True)

    nombre: str = Field(max_length=100, unique=True, index=True)
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None

    parent_id: Optional[int] = Field(default=None, foreign_key="categorias.id")

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None

    parent: Optional["Categoria"] = Relationship (
        back_populates ="children",
        sa_relationship_kwargs={"remote_side": "Categoria.id"}
    )

    children: List["Categoria"] = Relationship(back_populates="parent")

    productos: List["Producto"] = Relationship(
        back_populates="categorias", 
        link_model=ProductoCategoria
        )