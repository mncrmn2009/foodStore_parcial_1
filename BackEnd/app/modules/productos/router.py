# app/modules/productos/router.py
from fastapi import APIRouter, Depends, Query, status, Path
from sqlmodel import Session
from typing import Annotated

from app.core.database import get_session
from app.modules.productos.schemas import ProductoCreate, ProductoPublic, ProductoUpdate, ProductoList
from app.modules.productos.service import ProductoService

router = APIRouter()

def get_producto_service(session: Session = Depends(get_session)) -> ProductoService:
    """Factory de dependencia: inyecta el servicio con su Session."""
    return ProductoService(session)

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=ProductoPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un producto",
    description="Crea un producto y lo asocia a las categorías enviadas en categoria_ids."
)
def create_producto(
    data: ProductoCreate,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoPublic:
    return svc.create(data)


@router.get(
    "/",
    response_model=ProductoList,
    summary="Listar productos activos (paginado)",
)
def list_productos(
    offset: Annotated[int, Query(ge=0, description="Registros a omitir")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description= "Limite por pagina")] = 20,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoList:
    return svc.get_all(offset=offset, limit=limit)


@router.get(
    "/{producto_id}",
    response_model=ProductoPublic,
    summary="Obtener producto por ID",
)
def get_producto(
    producto_id: Annotated[int, Path(ge=1, description= "ID del producto")],
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoPublic:
    return svc.get_by_id(producto_id)


@router.patch(
    "/{producto_id}",
    response_model=ProductoPublic,
    summary="Actualización parcial de producto",
    description="Si se envía categoria_ids, reemplazará las categorías actuales del producto."
)
def update_producto(
    producto_id: Annotated[int, Path(ge=1, description="ID del producto a actualizar")],
    data: ProductoUpdate,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoPublic:
    return svc.update(producto_id, data)


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de producto",
)
def delete_producto(
    producto_id: Annotated[int, Path(ge=1, description="ID del producto a eliminar")],
    svc: ProductoService = Depends(get_producto_service),
) -> None:
    svc.soft_delete(producto_id)