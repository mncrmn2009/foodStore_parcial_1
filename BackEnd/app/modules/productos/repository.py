# app/modules/productos/repository.py
from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.productos.models import Producto

class ProductoRepository(BaseRepository[Producto]):
    """
    Repositorio de Productos.
    Agrega queries específicas del dominio sobre el CRUD base.
    Solo habla con la DB — nunca levanta HTTPException.
    """
    def __init__(self, session: Session) -> None:
        """
        Inicializa el repositorio de Producto.

        Args:
            session (Session): Sesión activa de base de datos.
        """
        super().__init__(session, Producto)

    def get_by_nombre(self, nombre: str) -> Producto | None:
        """
        Obtiene un producto por su nombre exacto.

        Args:
            nombre (str): Nombre del producto.

        Returns:
            Producto | None: Instancia encontrada o None si no existe.
        """
        return self.session.exec(
            select(Producto).where(Producto.nombre == nombre)
        ).first()

    def get_active(self, offset: int = 0, limit: int = 20) -> list[Producto]:
        """
        Obtiene productos activos (no borrados lógicamente) con paginación.

        Args:
            offset (int): Cantidad de registros a omitir.
            limit (int): Máximo de registros a devolver.

        Returns:
            list[Producto]: Lista de productos activos.
        """
        return list(
            self.session.exec(
                select(Producto)
                .where(Producto.deleted_at == None)  # Filtramos por borrado lógico
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def count_active(self) -> int:
        """
        Cuenta la cantidad total de productos activos.
        Esencial para la respuesta de paginación.

        Returns:
            int: Total de registros activos.
        """
        return len(
            self.session.exec(
                select(Producto).where(Producto.deleted_at == None)
            ).all()
        )
    