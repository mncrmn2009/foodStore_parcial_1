# app/modules/categorias/service.py
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlmodel import Session

from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaPublic, CategoriaUpdate, CategoriaList
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaService:
    """
    Capa de lógica de negocio para Categorías.

    Responsabilidades:
    - Validaciones de dominio (nombre único, parent_id válido, etc.)
    - Coordinar repositorios a través del UoW
    - Levantar HTTPException cuando corresponde
    - NUNCA acceder directamente a la Session

    REGLA IMPORTANTE — objetos ORM y commit():
    Después de que el UoW hace commit(), SQLAlchemy expira los atributos
    del objeto ORM. Toda serialización (model_dump / model_validate)
    debe ocurrir DENTRO del bloque `with uow:`, antes de que __exit__
    dispare el commit.
    """

    def __init__(self, session: Session) -> None:
        """
        Inicializa el servicio con una sesión de base de datos.

        Args:
            session (Session): Sesión activa que será utilizada por el UnitOfWork.

        Nota:
            El servicio no maneja directamente la transacción; delega en UnitOfWork.
        """
        self._session = session


    # ── Helpers privados ──────────────────────────────────────────────────────

    def _get_or_404(self, uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        """
        Obtiene una categoría por ID o lanza excepción HTTP 404 si no existe
        o si está borrada lógicamente.

        Args:
            uow (CategoriaUnitOfWork): Unidad de trabajo activa.
            categoria_id (int): ID de la categoría.

        Returns:
            Categoria: Instancia encontrada.

        Raises:
            HTTPException: 404 si la categoría no existe.
        """
        categoria = uow.categorias.get_by_id(categoria_id)
        if not categoria or categoria.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con id={categoria_id} no encontrada",
            )
        return categoria


    def _assert_nombre_unique(self, uow: CategoriaUnitOfWork, nombre: str) -> None:
        """
        Valida que el nombre no esté en uso.

        Args:
            uow (CategoriaUnitOfWork): Unidad de trabajo activa.
            nombre (str): Nombre a validar.

        Raises:
            HTTPException: 409 si el nombre ya existe.
        """
        if uow.categorias.get_by_nombre(nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El nombre '{nombre}' ya está en uso",
            )


    def _get_parent_or_404(self, uow: CategoriaUnitOfWork, parent_id: int) -> Categoria:
        """
        Verifica que la categoría padre exista.

        Args:
            uow (CategoriaUnitOfWork): Unidad de trabajo activa.
            parent_id (int): ID de la categoría padre.

        Raises:
            HTTPException: 404 si el padre no existe.
        """
        parent = uow.categorias.get_by_id(parent_id)
        if not parent or parent.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría padre con id={parent_id} no encontrada",
            )
        return parent

    # ── Casos de uso ─────────────────────────────────────────────────────────

    def create(self, data: CategoriaCreate) -> CategoriaPublic:
        """
        Crea una nueva categoría.

        Flujo:
        - Valida unicidad de nombre
        - Construye entidad desde DTO
        - Persiste usando repositorio
        - Serializa antes de cerrar la transacción
        """
        with CategoriaUnitOfWork(self._session) as uow:
            self._assert_nombre_unique(uow, data.nombre)
            
            if data.parent_id:
                self._get_parent_or_404(uow, data.parent_id)
                
            categoria = Categoria.model_validate(data)
            uow.categorias.add(categoria)

            # Serializar dentro del contexto asegura acceso a atributos lazy
            result = CategoriaPublic.model_validate(categoria)

        return result


    def get_all(self, offset: int = 0, limit: int = 20) -> CategoriaList:
        """
        Obtiene lista paginada de categorías activas.
        """
        with CategoriaUnitOfWork(self._session) as uow:
            categorias = uow.categorias.get_active(offset=offset, limit=limit)
            total = uow.categorias.count_active()

            result = CategoriaList(
                data=[CategoriaPublic.model_validate(c) for c in categorias],
                total=total,
            )

        return result


    def get_by_id(self, categoria_id: int) -> CategoriaPublic:
        """
        Obtiene una categoría por ID.
        """
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)
            result = CategoriaPublic.model_validate(categoria)

        return result


    def update(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaPublic:
        """
        Actualiza una categoría existente de forma parcial (PATCH).

        Flujo:
        - Obtiene entidad
        - Valida nombre si cambia
        - Valida parent_id si cambia
        - Aplica cambios dinámicamente y actualiza updated_at
        - Persiste cambios
        """
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)

            if data.nombre and data.nombre != categoria.nombre:
                self._assert_nombre_unique(uow, data.nombre)

            if data.parent_id and data.parent_id != categoria.parent_id:
                self._get_parent_or_404(uow, data.parent_id)

            # Solo campos enviados por el cliente
            patch = data.model_dump(exclude_unset=True)

            for field, value in patch.items():
                setattr(categoria, field, value)
                
            categoria.updated_at = datetime.now(timezone.utc)

            uow.categorias.add(categoria)
            result = CategoriaPublic.model_validate(categoria)

        return result


    def soft_delete(self, categoria_id: int) -> None:
        """
        Realiza un borrado lógico de la categoría.

        Flujo:
        - Obtiene entidad
        - Marca con fecha en deleted_at
        - Persiste cambio
        """
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)
            categoria.deleted_at = datetime.now(timezone.utc)
            uow.categorias.add(categoria)