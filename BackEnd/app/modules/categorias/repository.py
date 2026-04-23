from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.categorias.models import Categoria

class CategoriaRepository(BaseRepository[Categoria]):
    """
    Repositorio de Categorías.
    Agrega queries específicas del dominio sobre el CRUD base.
    Solo habla con la DB — nunca levanta HTTPException.
    """
    def __init__(self, session: Session) -> None:
        """
        Inicializa el repositorio de Categoria.

        Args:
            session (Session): Sesión activa de base de datos.
        """
        super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        """
        Obtiene una categoría por su nombre.

        Args:
            nombre (str): Nombre de la categoría.

        Returns:
            Categoria | None: Instancia encontrada o None si no existe.
        """
        return self.session.exec(
            select(Categoria).where(Categoria.nombre == nombre)
        ).first()

    def get_active(self, offset: int = 0, limit: int = 20) -> list[Categoria]:
        """
        Obtiene categorías activas (no borradas lógicamente) con paginación.

        Args:
            offset (int): Cantidad de registros a omitir.
            limit (int): Máximo de registros a devolver.

        Returns:
            list[Categoria]: Lista de categorías activas.
        """
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.deleted_at == None)  # Filtramos por borrado lógico
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_by_parent(self, parent_id: int) -> list[Categoria]:
        """
        Obtiene todas las subcategorías asociadas a una categoría padre.

        Args:
            parent_id (int): ID de la categoría padre.

        Returns:
            list[Categoria]: Lista de subcategorías.
        """
        return list(
            self.session.exec(
                select(Categoria).where(Categoria.parent_id == parent_id)
            ).all()
        )

    def count_active(self) -> int:
        """
        Cuenta la cantidad total de categorías activas.

        Returns:
            int: Total de registros activos en la tabla categorias.
        """
        # Se filtra por deleted_at para contar solo las activas
        return len(
            self.session.exec(
                select(Categoria).where(Categoria.deleted_at == None)
            ).all()
        )