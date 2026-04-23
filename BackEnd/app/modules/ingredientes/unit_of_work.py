# app/modules/ingredientes/unit_of_work.py
from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.modules.ingredientes.repository import IngredienteRepository

class IngredienteUnitOfWork(UnitOfWork):
    """
    UoW específico del módulo ingredientes.
    Expone los repositorios que el servicio necesita coordinar.

    Al entrar al contexto (with uow:) todos los repositorios
    comparten la misma Session → misma transacción.
    """

    def __init__(self, session: Session) -> None:
        """
        UnitOfWork específico del dominio Ingrediente.

        Repositorios expuestos:
            - ingredientes: acceso a operaciones sobre Ingrediente
        """
        super().__init__(session)
        self.ingredientes = IngredienteRepository(session)