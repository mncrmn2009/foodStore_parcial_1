# app/modules/ingredientes/repository.py
from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.ingredientes.models import Ingrediente

class IngredienteRepository(BaseRepository[Ingrediente]):
    """
    Repositorio de Ingredientes.
    Agrega queries específicas del dominio sobre el CRUD base.
    """
    def __init__(self, session: Session) -> None:
        super().__init__(session, Ingrediente)

    def get_by_nombre(self, nombre: str) -> Ingrediente | None:
        """Obtiene un ingrediente por su nombre exacto."""
        return self.session.exec(
            select(Ingrediente).where(Ingrediente.nombre == nombre)
        ).first()

    def get_active(self, offset: int = 0, limit: int = 20) -> list[Ingrediente]:
        """Obtiene ingredientes activos con paginación."""
        return list(
            self.session.exec(
                select(Ingrediente)
                .where(Ingrediente.deleted_at.is_(None))  # ¡A prueba de fallos!
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def count_active(self) -> int:
        """Cuenta la cantidad total de ingredientes activos."""
        return len(
            self.session.exec(
                select(Ingrediente).where(Ingrediente.deleted_at.is_(None))
            ).all()
        )