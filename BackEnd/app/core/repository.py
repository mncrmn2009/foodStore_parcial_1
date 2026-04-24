from typing import Generic, TypeVar, Type, Sequence
from sqlmodel import Session, SQLModel, select

ModelT = TypeVar("ModelT", bound=SQLModel)

class BaseRepository(Generic[ModelT]):
    """
    Repositorio genérico que implementa operaciones CRUD básicas
    para cualquier modelo basado en SQLModel.
    """
    def __init__(self, session: Session, model: Type[ModelT]) -> None:
        self.session = session
        self.model = model

    def get_by_id(self, record_id: int) -> ModelT | None:
        """Obtiene una entidad por su ID primario."""
        return self.session.get(self.model, record_id)

    def get_all(self, offset: int = 0, limit: int = 20) -> Sequence[ModelT]:
        """Obtiene una lista paginada de entidades."""
        return self.session.exec(
            select(self.model).offset(offset).limit(limit)
        ).all()

    def add(self, instance: ModelT) -> ModelT:
        """Persiste una nueva entidad en la sesión actual."""
        self.session.add(instance)
        self.session.flush()  # obtener el ID sin hacer un commit
        self.session.refresh(instance)
        return instance

    def delete(self, instance: ModelT) -> None:
        """Marca una entidad para eliminación en la base de datos."""
        self.session.delete(instance)
        self.session.flush()