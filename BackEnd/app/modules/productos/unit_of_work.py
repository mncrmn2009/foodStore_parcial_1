# app/modules/productos/unit_of_work.py
from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork

from app.modules.productos.repository import ProductoRepository
from app.modules.categorias.repository import CategoriaRepository
from app.modules.ingredientes.repository import IngredienteRepository

class ProductoUnitOfWork(UnitOfWork):
    """
    UoW específico del módulo productos.
    Expone los repositorios que el servicio necesita coordinar.

    Al entrar al contexto (with uow:) todos los repositorios
    comparten la misma Session → misma transacción.
    """

    def __init__(self, session: Session) -> None:
        """
        UnitOfWork específico del dominio Producto.

        Extiende el UnitOfWork base y registra los repositorios necesarios
        para operar dentro de una misma transacción consistente.

        Repositorios expuestos:
            - productos: acceso a operaciones principales sobre Producto.
            - categorias: acceso a operaciones sobre Categoria (necesario para 
                          validar que los categoria_ids enviados existan antes 
                          de asociarlos al producto).

        Args:
            session (Session): Sesión activa de base de datos compartida
                               por todos los repositorios.
        """
        super().__init__(session)
        self.productos = ProductoRepository(session)
        self.categorias = CategoriaRepository(session)
        self.ingredientes = IngredienteRepository(session)