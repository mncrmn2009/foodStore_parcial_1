# 🎯 LÓGICA BACKEND - Orden de Codificación

**Objetivo:** Entender el flujo lógico de cómo se construye el backend paso a paso.

---

## 📋 Índice de Orden de Codificación

1. [Configuración Core](#1-configuración-core)
2. [Definición de Modelos](#2-definición-de-modelos)
3. [Creación de Schemas](#3-creación-de-schemas)
4. [Implementación de Servicios](#4-implementación-de-servicios)
5. [Creación de Routers](#5-creación-de-routers)
6. [Integración en Main](#6-integración-en-main)
7. [Testing de Endpoints](#7-testing-de-endpoints)

---

## 🔹 1. Configuración Core

### ¿Por qué primero?
La configuración es la **base** de todo. Sin ella, no podemos conectar a la BD ni ejecutar la app.

### Paso 1.1: `app/core/config.py`

**¿Qué hace?** Lee variables de ambiente del `.env` y las centraliza.

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Todas las configuraciones en un solo lugar"""
    
    DATABASE_URL: str  # Va a venir del .env
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"  # Lee de aquí

settings = Settings()  # Instancia global
```

**¿Por qué es importante?**
- Si la BD está mal configurada, **nada funciona**
- Evita hardcodear credenciales
- Permite cambiar fácilmente entre dev/prod

### Paso 1.2: `app/core/database.py`

**¿Qué hace?** Crea la conexión a PostgreSQL y la sesión.

```python
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

# 1. Crear el motor (engine) que conecta a PostgreSQL
engine = create_engine(settings.DATABASE_URL, echo=False)

# 2. Función que crea TODAS las tablas (depende de los modelos estar importados)
def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)

# 3. Función que FastAPI usa para dar sesión a cada request
def get_session():
    with Session(engine) as session:
        yield session  # Proporciona sesión
    # Auto-cierra la sesión después del request
```

**¿Por qué es importante?**
- `get_session` es una **dependencia de FastAPI**
- Se usa en todos los routers (inyección de dependencias)
- La sesión es el puente entre Python y PostgreSQL

**Flujo:**
```
FastAPI request
    ↓
@router.get("/")
def endpoint(session = Depends(get_session))  ← get_session() aquí
    ↓
SQLModel query en sesión
    ↓
PostgreSQL
```

---

## 🔹 2. Definición de Modelos

### ¿Por qué segundo?

Los **modelos definen la estructura de datos**. Todo lo demás depende de ellos:
- Las tablas en la BD
- Los schemas de validación
- La lógica en servicios

### Paso 2.1: `app/modules/categorias/models.py`

**¿Qué hace?** Define la tabla `categorias` con sus campos y relaciones.

```python
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone

# TYPE_CHECKING evita importaciones circulares
if TYPE_CHECKING:
    from app.modules.productos.models import Producto

class Categoria(SQLModel, table=True):
    """SQLModel = Pydantic + SQLAlchemy + SQL"""
    
    __tablename__ = "categorias"
    
    # COLUMNA: id
    id: Optional[int] = Field(default=None, primary_key=True)
    # ¿Qué significa?
    # - Optional[int] = puede ser null
    # - default=None = la BD genera el valor
    # - primary_key=True = es el identificador único
    
    # COLUMNA: nombre
    nombre: str = Field(max_length=100, unique=True, index=True)
    # ¿Qué significa?
    # - str = tipo de dato
    # - max_length=100 = validación Pydantic (también en BD)
    # - unique=True = no permite duplicados
    # - index=True = crea índice para búsquedas rápidas
    
    # COLUMNA: descripción (opcional)
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    
    # RELACIÓN 1:N CONSIGO MISMO (categorías jerárquicas)
    parent_id: Optional[int] = Field(default=None, foreign_key="categorias.id")
    # Permite: Bebidas > Cálidas > Café
    
    # AUDITORÍA - cuándo se creó/modificó
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None  # Soft delete
    
    # RELACIONES ORM (cómo se conecta a otras tablas)
    parent: Optional["Categoria"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Categoria.id"}
    )
    children: List["Categoria"] = Relationship(back_populates="parent")
    
    productos: List["Producto"] = Relationship(
        back_populates="categorias",
        link_model="ProductoCategoria"
    )
```

**Desglose de la relación:**

```
TABLA categorias:
┌─────┬─────────┬──────────────┐
│ id  │ nombre  │ parent_id    │
├─────┼─────────┼──────────────┤
│ 1   │ Bebidas │ NULL         │  ← Categoría raíz
│ 2   │ Cálidas │ 1            │  ← Subcat de Bebidas
│ 3   │ Café    │ 2            │  ← Sub-subcategoría
└─────┴─────────┴──────────────┘

En Python (ORM):
categoria = Categoria(id=3, nombre="Café")
categoria.parent.nombre  → "Cálidas"
categoria.parent.parent.nombre  → "Bebidas"
```

### Paso 2.2: `app/modules/productos/models.py`

**¿Qué hace?** Define tablas intermedias y la tabla productos.

```python
# TABLA INTERMEDIA: Producto-Categoría (N:M)
class ProductoCategoria(SQLModel, table=True):
    __tablename__ = "producto_categoria"
    
    # Clave compuesta (ambas juntas son la PK)
    producto_id: Optional[int] = Field(default=None, foreign_key="productos.id", primary_key=True)
    categoria_id: Optional[int] = Field(default=None, foreign_key="categorias.id", primary_key=True)

# ¿Por qué tabla intermedia?
# Un producto puede estar en varias categorías (N:M)
# Ejemplo: "Café" puede estar en:
#   - Categoría "Bebidas"
#   - Categoría "Cálidas"
#   - Categoría "Premium"
# 
# TABLA producto_categoria:
# ┌──────────────┬────────────────┐
# │ producto_id  │ categoria_id    │
# ├──────────────┼────────────────┤
# │ 5            │ 1              │  ← Café en Bebidas
# │ 5            │ 2              │  ← Café en Cálidas
# │ 5            │ 3              │  ← Café en Premium
# └──────────────┴────────────────┘

class Producto(SQLModel, table=True):
    __tablename__ = "productos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=150, unique=True, index=True)
    descripcion: Optional[str] = None
    
    # VALIDACIÓN: precio no negativo
    precio: float = Field(ge=0.0)
    # ge = greater or equal (>=)
    stock: int = Field(default=0)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    
    # RELACIÓN N:M con Categoría
    categorias: List["Categoria"] = Relationship(
        back_populates="productos",
        link_model=ProductoCategoria  # ← usa tabla intermedia
    )
    
    # RELACIÓN N:M con Ingrediente
    ingredientes: List["Ingrediente"] = Relationship(
        back_populates="productos",
        link_model=ProductoIngrediente
    )
```

**Visualización de relación N:M:**

```
TABLA productos:        TABLA producto_categoria:    TABLA categorias:
┌──────────────┐        ┌──────────┬───────────────┐  ┌──────────────┐
│ id  │ nombre │        │ prod_id  │ categ_id      │  │ id  │ nombre │
├──────────────┤        ├──────────┼───────────────┤  ├──────────────┤
│ 1   │ Café   │◄──────→│ 1        │ 1 (Bebidas)   │  │ 1   │Bebidas │
│ 2   │ Té     │        │ 1        │ 2 (Cálidas)   │  │ 2   │Cálidas │
│ 3   │ Agua   │        │ 2        │ 1 (Bebidas)   │  │ 3   │Frías   │
└──────────────┘        │ 3        │ 3 (Frías)     │  └──────────────┘
                        └──────────┴───────────────┘

En código:
cafe = Producto(id=1, nombre="Café")
cafe.categorias  → [Bebidas, Cálidas]
```

### Paso 2.3: `app/modules/ingredientes/models.py`

Sigue el mismo patrón que Categorias.

---

## 🔹 3. Creación de Schemas

### ¿Por qué tercero?

Los **schemas validan datos** antes de llegar a la lógica.

**Regla de oro:** Separar por operación:
- `CategoriaCreate` → POST (entrada)
- `CategoriaUpdate` → PATCH (entrada)
- `CategoriaPublic` → GET (salida)

### Paso 3.1: `app/modules/categorias/schemas.py`

```python
from typing import Optional, List
from sqlmodel import SQLModel
from datetime import datetime

# ENTRADA: Crear categoría (usuario manda esto)
class CategoriaCreate(SQLModel):
    nombre: str  # Requerido
    descripcion: Optional[str] = None  # Opcional
    imagen_url: Optional[str] = None
    parent_id: Optional[int] = None

# ¿Por qué no incluir id, created_at, etc?
# - id: la BD lo genera automáticamente
# - created_at: se asigna en el servidor (ahora)
# - deleted_at: siempre None al crear

# ENTRADA: Actualizar categoría (usuario manda esto)
class CategoriaUpdate(SQLModel):
    nombre: Optional[str] = None  # TODO opcional
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    parent_id: Optional[int] = None

# ¿Por qué TODO es opcional?
# - Puede actualizar solo el nombre, o solo la imagen
# - En el servicio chequea .model_dump(exclude_unset=True)

# SALIDA: Devolver categoría (servidor devuelve esto)
class CategoriaPublic(SQLModel):
    id: int  # Ahora SÍ incluye id
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    parent_id: Optional[int] = None
    created_at: datetime  # Metadatos de lectura
    updated_at: datetime

# ¿Por qué no incluir deleted_at?
# - No queremos exponer registros "eliminados"
# - Soft delete es interno del servidor

# SALIDA: Listar categorías (respuesta paginada)
class CategoriaList(SQLModel):
    data: List[CategoriaPublic]  # Lista de categorías
    total: int  # Total en BD (para calcular páginas)
```

**Ejemplo de flujo:**

```
USUARIO ENVÍA:
{
  "nombre": "Bebidas",
  "descripcion": "Todas las bebidas"
}
↓
CategoriaCreate (valida)
↓
Service.create()

SERVIDOR RESPONDE:
{
  "id": 5,
  "nombre": "Bebidas",
  "descripcion": "Todas las bebidas",
  "created_at": "2024-04-23T05:00:00",
  "updated_at": "2024-04-23T05:00:00"
}
↓
CategoriaPublic (serializa)
```

---

## 🔹 4. Implementación de Servicios

### ¿Por qué cuarto?

Los **servicios contienen la lógica de negocio**. Ahora que tenemos modelos y schemas, podemos escribir la lógica.

### Paso 4.1: `app/modules/categorias/service.py`

```python
from sqlmodel import Session, select
from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import (
    CategoriaCreate, CategoriaUpdate, CategoriaPublic, CategoriaList
)
from datetime import datetime, timezone
from fastapi import HTTPException, status

class CategoriaService:
    """Toda la lógica de negocio aquí, NO en el router"""
    
    def __init__(self, session: Session):
        # Cada request recibe su propia sesión
        self.session = session
    
    # ━━━━━━━━ CREAR ━━━━━━━━
    
    def create(self, data: CategoriaCreate) -> CategoriaPublic:
        """
        1. Recibe datos validados (data es CategoriaCreate)
        2. Crea instancia del modelo
        3. Guarda en BD
        4. Devuelve como CategoriaPublic
        """
        # 1. Instanciar modelo SQLModel
        categoria = Categoria(
            nombre=data.nombre,
            descripcion=data.descripcion,
            imagen_url=data.imagen_url,
            parent_id=data.parent_id
        )
        
        # 2. Agregar a sesión y confirmar cambios
        self.session.add(categoria)
        self.session.commit()
        
        # 3. Refrescar para obtener id generado
        self.session.refresh(categoria)
        
        # 4. Serializar a schema de salida
        return CategoriaPublic.model_validate(categoria)
    
    # ¿Por qué model_validate?
    # Convierte SQLModel a Pydantic schema
    # SQLModel sabe convertir porque hereda de SQLAlchemy y Pydantic
    
    # ━━━━━━━━ LISTAR ━━━━━━━━
    
    def get_all(self, offset: int = 0, limit: int = 20) -> CategoriaList:
        """
        1. Contar TOTAL (para el frontend sabe cuántas páginas hay)
        2. Obtener página actual (offset, limit)
        3. Devolver ambos
        """
        # 1. Contar sin eliminar lógicamente
        # where(Categoria.deleted_at.is_(None)) = solo NO eliminadas
        count_stmt = select(Categoria).where(Categoria.deleted_at.is_(None))
        total = len(self.session.exec(count_stmt).all())
        
        # 2. Obtener página
        stmt = (
            select(Categoria)
            .where(Categoria.deleted_at.is_(None))  # Filtrar eliminadas
            .offset(offset)  # Saltar primeros N
            .limit(limit)    # Tomar solo N
        )
        categorias = self.session.exec(stmt).all()
        
        # 3. Serializar cada una
        return CategoriaList(
            data=[CategoriaPublic.model_validate(c) for c in categorias],
            total=total
        )
    
    # ━━━━━━━━ LEER UNO ━━━━━━━━
    
    def get_by_id(self, categoria_id: int) -> CategoriaPublic:
        """
        1. Buscar por ID
        2. Validar que exista
        3. Devolver
        """
        # SQLModel query con where
        stmt = select(Categoria).where(
            (Categoria.id == categoria_id) & (Categoria.deleted_at.is_(None))
        )
        categoria = self.session.exec(stmt).first()  # .first() = un solo resultado
        
        # Validar existe
        if not categoria:
            raise HTTPException(
                status_code=404,
                detail="Categoría no encontrada"
            )
        
        return CategoriaPublic.model_validate(categoria)
    
    # ━━━━━━━━ ACTUALIZAR ━━━━━━━━
    
    def update(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaPublic:
        """
        1. Buscar registro
        2. Actualizar solo campos PROVIDED (no todos)
        3. Guardar
        4. Devolver
        """
        # 1. Buscar
        stmt = select(Categoria).where(Categoria.id == categoria_id)
        categoria = self.session.exec(stmt).first()
        
        # Validar existe y no está eliminada
        if not categoria or categoria.deleted_at:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        # 2. Actualizar solo lo que vino
        # model_dump(exclude_unset=True) = solo los que el usuario mandó
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(categoria, key, value)  # categoria.nombre = value
        
        # 3. Marcar como actualizada
        categoria.updated_at = datetime.now(timezone.utc)
        
        # 4. Guardar
        self.session.add(categoria)
        self.session.commit()
        self.session.refresh(categoria)
        
        return CategoriaPublic.model_validate(categoria)
    
    # ━━━━━━━━ ELIMINAR (SOFT DELETE) ━━━━━━━━
    
    def soft_delete(self, categoria_id: int) -> None:
        """
        NO borra de la BD, solo marca como eliminada.
        
        Ventajas:
        - Recuperar datos si hay error
        - Mantener auditoría
        - Las relaciones siguen intactas
        """
        stmt = select(Categoria).where(Categoria.id == categoria_id)
        categoria = self.session.exec(stmt).first()
        
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        # Marcar como eliminada
        categoria.deleted_at = datetime.now(timezone.utc)
        
        self.session.add(categoria)
        self.session.commit()
```

**Flujo lógico CRUD:**

```
CREAR:
data (JSON) → CategoriaCreate (validado) → Service.create() → 
Categoria (modelo) → BD → refresh → CategoriaPublic → JSON

LISTAR:
BD (query) → Categorias (modelos) → [CategoriaPublic] → JSON

LEER UNO:
ID → BD (where) → Categoria (modelo) → CategoriaPublic → JSON

ACTUALIZAR:
ID + data → buscar → setattr loop → BD → CategoriaPublic → JSON

ELIMINAR:
ID → buscar → deleted_at = now() → BD → 204 No Content
```

---

## 🔹 5. Creación de Routers

### ¿Por qué quinto?

El **router conecta HTTP con Service**. Solo traduce requests a llamadas de servicio.

### Paso 5.1: `app/modules/categorias/router.py`

```python
from fastapi import APIRouter, Depends, Query, status, Path
from sqlmodel import Session
from typing import Annotated

from app.core.database import get_session
from app.modules.categorias.schemas import (
    CategoriaCreate, CategoriaPublic, CategoriaUpdate, CategoriaList
)
from app.modules.categorias.service import CategoriaService

router = APIRouter()  # Router de este módulo

# ━━━━━━━━ INYECCIÓN DE DEPENDENCIAS ━━━━━━━━

def get_categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
    """
    FastAPI llama esto automáticamente.
    
    Flujo:
    GET /categorias/
      ↓
    FastAPI necesita 'svc' en el endpoint
      ↓
    Llama get_categoria_service()
      ↓
    Inyecta 'session' (de get_session)
      ↓
    Crea CategoriaService(session)
      ↓
    Pasa 'svc' al endpoint
    """
    return CategoriaService(session)

# ━━━━━━━━ ENDPOINTS ━━━━━━━━

@router.post(
    "/",  # POST /categorias/
    response_model=CategoriaPublic,  # Respuesta serializada así
    status_code=status.HTTP_201_CREATED,  # 201 en vez de 200
    summary="Crear una categoría"
)
def create_categoria(
    data: CategoriaCreate,  # Body JSON, validado automático
    svc: CategoriaService = Depends(get_categoria_service)  # Inyectada
) -> CategoriaPublic:
    """
    Flujo:
    1. POST /categorias/ con JSON
    2. FastAPI deserializa a CategoriaCreate
    3. Valida (si falla → 422 Unprocessable Entity)
    4. Llama get_categoria_service() → obtiene svc
    5. Llama endpoint → svc.create(data)
    6. Serializa respuesta a CategoriaPublic
    7. Responde 201 + JSON
    """
    return svc.create(data)

@router.get(
    "/",  # GET /categorias/
    response_model=CategoriaList,
    summary="Listar categorías activas (paginado)"
)
def list_categorias(
    # Annotated[] = documentación + validación automática
    offset: Annotated[int, Query(ge=0, description="Registros a omitir")] = 0,
    # ge=0 = greater or equal = offset >= 0
    limit: Annotated[int, Query(ge=1, le=100, description="Límite por página")] = 20,
    # ge=1, le=100 = 1 <= limit <= 100
    svc: CategoriaService = Depends(get_categoria_service)
) -> CategoriaList:
    """
    Query parámeters: GET /categorias/?offset=0&limit=20
    
    Validación automática:
    - GET /categorias/?offset=-5  → 422 (offset < 0)
    - GET /categorias/?limit=500  → 422 (limit > 100)
    - GET /categorias/?offset=abc → 422 (no es int)
    """
    return svc.get_all(offset=offset, limit=limit)

@router.get(
    "/{categoria_id}",  # GET /categorias/{categoria_id}
    response_model=CategoriaPublic,
    summary="Obtener categoría por ID"
)
def get_categoria(
    categoria_id: Annotated[int, Path(ge=1, description="ID de la categoría")],
    # Path() = validar parámetro de ruta
    # ge=1 = id >= 1 (no permite id=0, id=-1)
    svc: CategoriaService = Depends(get_categoria_service)
) -> CategoriaPublic:
    """
    GET /categorias/5  → categoria_id=5
    GET /categorias/abc  → 422 (no es int)
    GET /categorias/0  → 422 (id < 1)
    """
    return svc.get_by_id(categoria_id)

@router.patch(
    "/{categoria_id}",  # PATCH /categorias/{categoria_id}
    response_model=CategoriaPublic,
    summary="Actualizar categoría (parcial)"
)
def update_categoria(
    categoria_id: Annotated[int, Path(ge=1, description="ID de la categoría")],
    data: CategoriaUpdate,  # Body JSON
    svc: CategoriaService = Depends(get_categoria_service)
) -> CategoriaPublic:
    """
    PATCH vs PUT:
    - PATCH: actualiza solo los campos mandados (parcial)
    - PUT: reemplaza todo (requiere todos los campos)
    
    Nosotros usamos PATCH porque CategoriaUpdate tiene TODO opcional.
    """
    return svc.update(categoria_id, data)

@router.delete(
    "/{categoria_id}",  # DELETE /categorias/{categoria_id}
    status_code=status.HTTP_204_NO_CONTENT,  # 204 = sin contenido (OK)
    summary="Eliminar categoría"
)
def delete_categoria(
    categoria_id: Annotated[int, Path(ge=1, description="ID de la categoría")],
    svc: CategoriaService = Depends(get_categoria_service)
) -> None:
    """
    204 No Content = operación exitosa pero no devuelve body.
    
    Respuesta:
    HTTP 204
    (vacío)
    """
    svc.soft_delete(categoria_id)
```

**Mapeo HTTP ↔ Service:**

```
POST /categorias
JSON → CategoriaCreate → svc.create() → 201 + CategoriaPublic

GET /categorias?offset=0&limit=20
Query params → svc.get_all(offset, limit) → 200 + CategoriaList

GET /categorias/5
Path param → svc.get_by_id(5) → 200 + CategoriaPublic

PATCH /categorias/5
Path param + JSON → svc.update(5, data) → 200 + CategoriaPublic

DELETE /categorias/5
Path param → svc.soft_delete(5) → 204 (vacío)
```

---

## 🔹 6. Integración en Main

### ¿Por qué sexto?

Una vez que todos los módulos están listos, los **ensambla** en el `main.py`.

### Paso 6.1: `main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_db_and_tables

# ━━━━━━━━ 1. IMPORTAR MODELOS ━━━━━━━━
# IMPORTANTE: Si no importas, SQLModel no sabe que existen
# y no crea las tablas en la BD

import app.modules.categorias.models
import app.modules.productos.models
import app.modules.ingredientes.models

# ¿Por qué solo import, no from?
# Porque solo necesita que Python ejecute el archivo.
# Las clases se registran en SQLModel.metadata automáticamente.

# ━━━━━━━━ 2. IMPORTAR ROUTERS ━━━━━━━━

from app.modules.categorias.router import router as categorias_router
from app.modules.productos.router import router as productos_router
from app.modules.ingredientes.router import router as ingredientes_router

# ━━━━━━━━ 3. LIFESPAN ━━━━━━━━

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ejecuta CODE antes de iniciar app (startup).
    Después del yield ejecuta CODE (shutdown).
    """
    # STARTUP
    create_db_and_tables()  # Crea tablas si no existen
    print("✓ Base de datos inicializada")
    
    yield  # App ejecuta
    
    # SHUTDOWN (opcional aquí)
    print("✓ App finalizada")

# ━━━━━━━━ 4. CREAR APP ━━━━━━━━

app = FastAPI(
    title="FoodStore API",
    description="API para el parcial",
    version="1.0.0",
    lifespan=lifespan
)

# ━━━━━━━━ 5. CORS MIDDLEWARE ━━━━━━━━

origins = ["http://localhost:5173"]  # Frontend Vite

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PATCH, DELETE
    allow_headers=["*"],  # Content-Type, etc
)

# ¿Por qué CORS?
# Por seguridad, browsers no permiten requests cross-origin
# CORS dice: "OK, confío en http://localhost:5173"

# ━━━━━━━━ 6. INCLUIR ROUTERS ━━━━━━━━

app.include_router(
    categorias_router,
    prefix="/categorias",  # GET /categorias/ → GET /categorias/
    tags=["Categorías"]     # Agrupa en Swagger UI
)

app.include_router(
    productos_router,
    prefix="/productos",
    tags=["Productos"]
)

app.include_router(
    ingredientes_router,
    prefix="/ingredientes",
    tags=["Ingredientes"]
)

# ━━━━━━━━ 7. ENDPOINTS RAÍZ ━━━━━━━━

@app.get("/")
def root():
    """Health check"""
    return {"message": "FoodStore API funcionando"}

# ━━━━━━━━ 8. EJECUTAR ━━━━━━━━

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",  # Escucha en todas las interfaces
        port=5000,
        reload=True  # Recarga en cambios (dev)
    )
```

**Flujo al iniciar:**

```
python main.py
    ↓
lifespan startup
    ↓
import app.modules.categorias.models
    ↓ (SQLModel registra tabla)
import app.modules.productos.models
import app.modules.ingredientes.models
    ↓ (todas las tablas están registradas)
create_db_and_tables()
    ↓
SQLModel.metadata.create_all(engine)
    ↓ (CREATE TABLE IF NOT EXISTS en PostgreSQL)
app running on http://0.0.0.0:5000
    ↓
uvicorn recibe requests
    ↓
Routing
    ↓
CRUD operations
```

---

## 🔹 7. Testing de Endpoints

### ¿Por qué séptimo?

Una vez todo ensamblado, **valida que funcione correctamente**.

### Paso 7.1: Usar Swagger UI

```
1. uvicorn main:app --reload
2. Abrir http://localhost:5000/docs
3. Probar cada endpoint
```

### Paso 7.2: Testing Manual

```bash
# POST: Crear categoría
curl -X POST http://localhost:5000/categorias \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Bebidas",
    "descripcion": "Todas las bebidas"
  }'

# Respuesta esperada: 201 + JSON con id, created_at, etc

# GET: Listar
curl http://localhost:5000/categorias?offset=0&limit=20

# Respuesta: 200 + CategoriaList (data array + total)

# GET: Una categoría
curl http://localhost:5000/categorias/1

# Respuesta: 200 + CategoriaPublic

# PATCH: Actualizar
curl -X PATCH http://localhost:5000/categorias/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Bebidas Premium"}'

# Respuesta: 200 + CategoriaPublic actualizado

# DELETE: Eliminar
curl -X DELETE http://localhost:5000/categorias/1

# Respuesta: 204 (sin contenido)
```

### Paso 7.3: Verificar en PostgreSQL

```bash
# Conectar a BD
psql -U usuario -d foodstore_db

# Ver tablas
\dt

# Ver categorías
SELECT * FROM categorias;

# Ver timestamps
SELECT id, nombre, created_at, deleted_at FROM categorias;
```

---

## 📊 Resumen del Orden

| Paso | Archivo | ¿Por qué? | Depende de |
|------|---------|-----------|-----------|
| 1 | `core/config.py` | Lee configuración | Nada |
| 2 | `core/database.py` | Conecta a BD | config.py |
| 3 | `*/models.py` | Define tablas | database.py |
| 4 | `*/schemas.py` | Valida datos | models.py |
| 5 | `*/service.py` | Lógica de negocio | models.py + schemas.py |
| 6 | `*/router.py` | HTTP ↔ Service | service.py |
| 7 | `main.py` | Ensambla todo | models.py + routers |
| 8 | Testing | Valida funcionalidad | main.py |

---

## 🎯 Lógica de Dependencias

```
main.py
    ↓
├─ import models (▼)
├─ import routers (▼)
└─ include_router()

models.py
    ↓
├─ from database import engine
├─ define SQLModel classes
└─ Relationship() references

routers.py
    ↓
├─ Depends(get_session) → database.py
├─ CategoriaCreate/Public → schemas.py
└─ CategoriaService → service.py

service.py
    ↓
├─ from models import Categoria
├─ from schemas import CategoriaCreate, etc.
└─ CRUD logic

schemas.py
    ↓
└─ reference models for validation

database.py
    ↓
├─ from config import settings
└─ create_engine()

config.py
    ↓
└─ BaseSettings (lee .env)
```

---

## ✅ Checklist de Codificación Backend

```
✓ 1. core/config.py - Configuración
✓ 2. core/database.py - Conexión
✓ 3. Crear todos los modelos (categorias, productos, ingredientes)
✓ 4. Crear todos los schemas (Create, Update, Public, List)
✓ 5. Crear todos los servicios (CRUD logic)
✓ 6. Crear todos los routers (endpoints)
✓ 7. main.py - Ensamblar
✓ 8. Probar en Swagger UI (/docs)
✓ 9. Probar en PostgreSQL (psql o pgAdmin)
✓ 10. Verificar CORS (frontend puede conectar)
```

---

## 🎓 Principios de Arquitectura

1. **Separación de concerns**: Config → DB → Models → Schemas → Service → Router
2. **DRY (Don't Repeat Yourself)**: Centralizar lógica en servicios
3. **Type safety**: Usar Annotated, TypeChecking
4. **Validación en capas**: Pydantic (schemas) + SQLModel (models)
5. **Soft delete**: No borrar, marcar como eliminada

