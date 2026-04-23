# app/modules/productos/service.py
from datetime import datetime, timezone
from typing import List
from fastapi import HTTPException, status
from sqlmodel import Session

from app.modules.productos.models import Producto
from app.modules.categorias.models import Categoria
from app.modules.productos.schemas import ProductoCreate, ProductoPublic, ProductoUpdate, ProductoList
from app.modules.productos.unit_of_work import ProductoUnitOfWork

class ProductoService:
    """
    Capa de lógica de negocio para Productos.
    Maneja validaciones y la relación Muchos a Muchos con Categorías.
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    # ── Helpers privados ──────────────────────────────────────────────────────

    def _get_or_404(self, uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        """Obtiene un producto o lanza 404."""
        producto = uow.productos.get_by_id(producto_id)
        if not producto or producto.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con id={producto_id} no encontrado",
            )
        return producto

    def _assert_nombre_unique(self, uow: ProductoUnitOfWork, nombre: str) -> None:
        """Valida que el nombre del producto no esté en uso."""
        if uow.productos.get_by_nombre(nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El producto '{nombre}' ya existe",
            )

    def _sync_categorias(self, uow: ProductoUnitOfWork, categoria_ids: List[int]) -> List[Categoria]:
        """
        Busca las categorías por sus IDs y verifica que existan y estén activas.
        Devuelve una lista de objetos Categoria de la base de datos.
        """
        if not categoria_ids:
            return []

        categorias_db = []
        for cat_id in categoria_ids:
            cat = uow.categorias.get_by_id(cat_id)
            if not cat or cat.deleted_at is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La categoría con id={cat_id} no existe o está inactiva."
                )
            categorias_db.append(cat)
            
        return categorias_db

    def _sync_ingredientes(self, uow, ingrediente_ids: List[int]):
        """
        Busca los ingredientes por sus IDs y verifica que existan y estén activos.
        Devuelve una lista de objetos Ingrediente de la base de datos.
        """
        if not ingrediente_ids:
            return []
        
        ingredientes_db = []
        for ing_id in ingrediente_ids:
            ing = uow.ingredientes.get_by_id(ing_id)
            if not ing or ing.deleted_at is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El ingrediente con id={ing_id} no existe o está inactivo."
                )
            ingredientes_db.append(ing)
        
        return ingredientes_db
    # ── Casos de uso ─────────────────────────────────────────────────────────

    def create(self, data: ProductoCreate) -> ProductoPublic:
        """
        Crea un nuevo producto y lo asocia a sus categorías e ingredientes.
        """
        with ProductoUnitOfWork(self._session) as uow:
            self._assert_nombre_unique(uow, data.nombre)

            # 1. Obtenemos los objetos Categoria y Ingrediente reales desde la BD
            categorias_relacionadas = self._sync_categorias(uow, data.categoria_ids)
            ingredientes_relacionados = self._sync_ingredientes(uow, data.ingrediente_ids)

            # 2. Creamos el producto excluyendo los campos relación que no son de la tabla
            producto_data = data.model_dump(exclude={"categoria_ids", "ingrediente_ids"})
            producto = Producto(**producto_data)

            # 3. Asignamos las relaciones
            producto.categorias = categorias_relacionadas
            producto.ingredientes = ingredientes_relacionados

            # 4. Guardamos
            uow.productos.add(producto)
            result = ProductoPublic.model_validate(producto)

        return result

    def get_all(self, offset: int = 0, limit: int = 20) -> ProductoList:
        """Lista paginada de productos activos."""
        with ProductoUnitOfWork(self._session) as uow:
            productos = uow.productos.get_active(offset=offset, limit=limit)
            total = uow.productos.count_active()

            result = ProductoList(
                data=[ProductoPublic.model_validate(p) for p in productos],
                total=total,
            )
        return result

    def get_by_id(self, producto_id: int) -> ProductoPublic:
        """Obtiene un producto por ID."""
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            result = ProductoPublic.model_validate(producto)
        return result

    def update(self, producto_id: int, data: ProductoUpdate) -> ProductoPublic:
        """
        Actualiza un producto. Si se envía categoria_ids, se reemplaza la lista completa.
        """
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)

            if data.nombre and data.nombre != producto.nombre:
                self._assert_nombre_unique(uow, data.nombre)

            # 1. Actualizamos la relación de categorías si el cliente envió la lista
            if data.categoria_ids is not None:
                nuevas_categorias = self._sync_categorias(uow, data.categoria_ids)
                producto.categorias = nuevas_categorias

            if data.ingrediente_ids is not None:
                nuevos_ingredientes = self._sync_ingredientes(uow, data.ingrediente_ids)
                producto.ingredientes = nuevos_ingredientes

            # 2. Actualizamos el resto de campos (excluyendo categoria_ids e ingrediente_ids)
            patch = data.model_dump(exclude_unset=True, exclude={"categoria_ids", "ingrediente_ids"})
            for field, value in patch.items():
                setattr(producto, field, value)

            producto.updated_at = datetime.now(timezone.utc)

            uow.productos.add(producto)
            result = ProductoPublic.model_validate(producto)

        return result

    def soft_delete(self, producto_id: int) -> None:
        """Borrado lógico del producto."""
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            producto.deleted_at = datetime.now(timezone.utc)
            uow.productos.add(producto)