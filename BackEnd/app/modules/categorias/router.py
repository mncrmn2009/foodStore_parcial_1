# app/modules/categorias/router.py
from fastapi import APIRouter, Depends, Query, status, Path
from sqlmodel import Session
from typing import Annotated

from app.core.database import get_session
from app.modules.categorias.schemas import CategoriaCreate, CategoriaPublic, CategoriaUpdate, CategoriaList
from app.modules.categorias.service import CategoriaService

router = APIRouter()


def get_categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
    """Factory de dependencia: inyecta el servicio con su Session."""
    return CategoriaService(session)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=CategoriaPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una categoría",
)
def create_categoria(
    data: CategoriaCreate,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaPublic:
    """Router delega al servicio — sin lógica de negocio aquí."""
    return svc.create(data)


@router.get(
    "/",
    response_model=CategoriaList,
    summary="Listar categorías activas (paginado)",
)
def list_categorias(
    offset: Annotated[int, Query(ge=0, description="Registros a omitir")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description= "Limite por pagina")] = 20,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaList:
    return svc.get_all(offset=offset, limit=limit)


@router.get(
    "/{categoria_id}",
    response_model=CategoriaPublic,
    summary="Obtener categoría por ID",
)
def get_categoria(
    categoria_id: Annotated[int, Path(ge=1, description= "ID de la categoria")],
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaPublic:
    return svc.get_by_id(categoria_id)


@router.patch(
    "/{categoria_id}",
    response_model=CategoriaPublic,
    summary="Actualización parcial de categoría",
)
def update_categoria(
    categoria_id: Annotated[int, Path(ge=1, description="ID de la categoria a actualizar")],
    data: CategoriaUpdate,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaPublic:
    return svc.update(categoria_id, data)


@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de categoría",
)
def delete_categoria(
    categoria_id: Annotated[int, Path(ge=1, description="ID de la categoria a eliminar")],
    svc: CategoriaService = Depends(get_categoria_service),
) -> None:
    svc.soft_delete(categoria_id)