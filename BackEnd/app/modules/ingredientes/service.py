# app/modules/ingredientes/service.py
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlmodel import Session

from app.modules.ingredientes.models import Ingrediente
from app.modules.ingredientes.schemas import IngredienteCreate, IngredientePublic, IngredienteUpdate, IngredienteList
from app.modules.ingredientes.unit_of_work import IngredienteUnitOfWork

class IngredienteService:
    """
    Capa de lógica de negocio para Ingredientes.
    Maneja validaciones y el ciclo de vida de la entidad.
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    # ── Helpers privados ──────────────────────────────────────────────────────

    def _get_or_404(self, uow: IngredienteUnitOfWork, ingrediente_id: int) -> Ingrediente:
        """Obtiene un ingrediente o lanza error 404."""
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente or ingrediente.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con id={ingrediente_id} no encontrado",
            )
        return ingrediente

    def _assert_nombre_unique(self, uow: IngredienteUnitOfWork, nombre: str) -> None:
        """Valida que no exista ya un ingrediente con ese nombre."""
        if uow.ingredientes.get_by_nombre(nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El ingrediente '{nombre}' ya existe",
            )

    # ── Casos de uso ─────────────────────────────────────────────────────────

    def create(self, data: IngredienteCreate) -> IngredientePublic:
        """Crea un nuevo ingrediente."""
        with IngredienteUnitOfWork(self._session) as uow:
            self._assert_nombre_unique(uow, data.nombre)
            
            ingrediente = Ingrediente.model_validate(data)
            uow.ingredientes.add(ingrediente)
            
            result = IngredientePublic.model_validate(ingrediente)

        return result

    def get_all(self, offset: int = 0, limit: int = 20) -> IngredienteList:
        """Lista paginada de ingredientes activos."""
        with IngredienteUnitOfWork(self._session) as uow:
            ingredientes = uow.ingredientes.get_active(offset=offset, limit=limit)
            total = uow.ingredientes.count_active()

            result = IngredienteList(
                data=[IngredientePublic.model_validate(i) for i in ingredientes],
                total=total,
            )
            
        return result

    def get_by_id(self, ingrediente_id: int) -> IngredientePublic:
        """Obtiene un ingrediente por ID."""
        with IngredienteUnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)
            result = IngredientePublic.model_validate(ingrediente)
            
        return result

    def update(self, ingrediente_id: int, data: IngredienteUpdate) -> IngredientePublic:
        """Actualiza el nombre de un ingrediente."""
        with IngredienteUnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)

            if data.nombre and data.nombre != ingrediente.nombre:
                self._assert_nombre_unique(uow, data.nombre)

            patch = data.model_dump(exclude_unset=True)
            for field, value in patch.items():
                setattr(ingrediente, field, value)

            ingrediente.updated_at = datetime.now(timezone.utc)
            
            uow.ingredientes.add(ingrediente)
            result = IngredientePublic.model_validate(ingrediente)

        return result

    def soft_delete(self, ingrediente_id: int) -> None:
        """Borrado lógico del ingrediente."""
        with IngredienteUnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)
            ingrediente.deleted_at = datetime.now(timezone.utc)
            uow.ingredientes.add(ingrediente)