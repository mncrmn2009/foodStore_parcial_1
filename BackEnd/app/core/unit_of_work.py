from sqlmodel import Session

class UnitOfWork:
    """
    Gestiona el ciclo de vida de la transacción de base de datos.

    Uso en servicios:
        with uow:
            uow.categorias.add(categoria)
        # commit automático si no hay excepción
        # rollback automático si hay excepción
    """

    def __init__(self, session: Session) -> None:
        """
        Inicializa el UnitOfWork con una sesión activa de base de datos.
        """
        self._session = session
        

    def __enter__(self) -> "UnitOfWork":
        """Método invocado al entrar en el contexto `with`."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Controla automáticamente la transacción."""
        if exc_type is None:
            self._session.commit()
        else:
            self._session.rollback()

    def commit(self) -> None:
        """Ejecuta un commit explícito de la transacción actual."""
        self._session.commit()

    def rollback(self) -> None:
        """Ejecuta un rollback explícito de la transacción actual."""
        self._session.rollback()