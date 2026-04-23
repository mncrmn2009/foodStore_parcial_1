# app/modules/ingredientes/router.py
from typing import Annotated
from fastapi import APIRouter, Depends, Query, status, Path
from sqlmodel import Session

from app.core.database import get_session
from app.modules.ingredientes.schemas import IngredienteCreate, IngredientePublic, IngredienteUpdate, IngredienteList
from app.modules.ingredientes.service import IngredienteService

router = APIRouter()

def get_ingrediente_service(session: Session = Depends(get_session)) -> IngredienteService:
    """Factory de dependencia: inyecta el servicio con su Session."""
    return IngredienteService(session)

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=IngredientePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un ingrediente",
)
def create_ingrediente(
    data: IngredienteCreate,
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> IngredientePublic:
    return svc.create(data)


@router.get(
    "/",
    response_model=IngredienteList,
    summary="Listar ingredientes activos (paginado)",
)
def list_ingredientes(
    offset: Annotated[int, Query(ge=0, description="Registros a omitir")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Límite por página")] = 20,
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> IngredienteList:
    return svc.get_all(offset=offset, limit=limit)


@router.get(
    "/{ingrediente_id}",
    response_model=IngredientePublic,
    summary="Obtener ingrediente por ID",
)
def get_ingrediente(
    ingrediente_id: Annotated[int, Path(ge=1, description="ID del ingrediente")],
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> IngredientePublic:
    return svc.get_by_id(ingrediente_id)


@router.patch(
    "/{ingrediente_id}",
    response_model=IngredientePublic,
    summary="Actualización parcial de ingrediente",
)
def update_ingrediente(
    ingrediente_id: Annotated[int, Path(ge=1, description="ID del ingrediente a actualizar")],
    data: IngredienteUpdate,
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> IngredientePublic:
    return svc.update(ingrediente_id, data)


@router.delete(
    "/{ingrediente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de ingrediente",
)
def delete_ingrediente(
    ingrediente_id: Annotated[int, Path(ge=1, description="ID del ingrediente a eliminar")],
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> None:
    svc.soft_delete(ingrediente_id)