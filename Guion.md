# 📖 GUIÓN - Creación del Proyecto Fullstack desde Cero

**FoodStore API** - Aplicación Fullstack con FastAPI + React + PostgreSQL

---

## 📋 Índice

1. [Backend - Configuración Inicial](#1-backend---configuración-inicial)
2. [Backend - Estructura de Módulos](#2-backend---estructura-de-módulos)
3. [Backend - Modelos SQLModel](#3-backend---modelos-sqlmodel)
4. [Backend - Servicios y Routers](#4-backend---servicios-y-routers)
5. [Frontend - Configuración Inicial](#5-frontend---configuración-inicial)
6. [Frontend - Estructura de Carpetas](#6-frontend---estructura-de-carpetas)
7. [Frontend - Componentes y Páginas](#7-frontend---componentes-y-páginas)
8. [Frontend - Integración con API](#8-frontend---integración-con-api)
9. [Integración Backend-Frontend](#9-integración-backend-frontend)
10. [Testing y Deployment](#10-testing-y-deployment)

---

## 1. Backend - Configuración Inicial

### 1.1 Crear estructura de carpetas

```bash
Parcial_Programacion/
├── BackEnd/
│   ├── app/
│   ├── test/
│   ├── .env
│   ├── .venv/
│   ├── main.py
│   └── requirements.txt
├── frontEnd/
└── Parcial_1.md
```

### 1.2 Crear entorno virtual

```bash
# Navegar al directorio BackEnd
cd BackEnd

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual (Windows)
.venv\Scripts\activate

# O en Linux/Mac:
source .venv/bin/activate
```

### 1.3 Crear `requirements.txt`

```txt
fastapi
uvicorn
sqlmodel
psycopg2-binary
python-dotenv
pydantic-settings
```

### 1.4 Instalar dependencias

```bash
pip install -r requirements.txt
```

### 1.5 Crear archivo `.env`

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@localhost:5432/foodstore_db
DEBUG=True
```

**Nota:** Reemplazar `usuario` y `password` con credenciales reales.

---

## 2. Backend - Estructura de Módulos

### 2.1 Crear estructura del directorio `app/`

```
app/
├── __init__.py
├── core/
│   ├── __init__.py
│   ├── config.py          # Configuración centralizada
│   ├── database.py        # Engine y sesiones
│   ├── repository.py      # Base repository pattern
│   └── unit_of_work.py    # Unit of Work pattern
└── modules/
    ├── __init__.py
    ├── categorias/
    │   ├── __init__.py
    │   ├── models.py      # SQLModel
    │   ├── schemas.py     # Pydantic schemas
    │   ├── router.py      # FastAPI router
    │   ├── service.py     # Lógica de negocio
    │   ├── repository.py  # Acceso a datos
    │   └── unit_of_work.py
    ├── productos/
    │   ├── __init__.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── router.py
    │   ├── service.py
    │   ├── repository.py
    │   └── unit_of_work.py
    └── ingredientes/
        ├── __init__.py
        ├── models.py
        ├── schemas.py
        ├── router.py
        ├── service.py
        ├── repository.py
        └── unit_of_work.py
```

### 2.2 Crear archivos `__init__.py`

Todos los directorios necesitan `__init__.py` (puede estar vacío):

```bash
# En BackEnd/
touch app/__init__.py
touch app/core/__init__.py
touch app/modules/__init__.py
touch app/modules/categorias/__init__.py
touch app/modules/productos/__init__.py
touch app/modules/ingredientes/__init__.py
```

---

## 3. Backend - Modelos SQLModel

### 3.1 Crear `app/core/config.py`

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 3.2 Crear `app/core/database.py`

```python
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)

def create_db_and_tables() -> None:
    """Crea todas las tablas definidas con SQLModel"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependencia FastAPI que provee una Session por request"""
    with Session(engine) as session:
        yield session
```

### 3.3 Crear `app/modules/categorias/models.py`

```python
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.productos.models import Producto, ProductoCategoria

class Categoria(SQLModel, table=True):
    """Modelo de Categoría con relación jerárquica (parent-children)"""
    
    __tablename__ = "categorias"

    id: Optional[int] = Field(default=None, primary_key=True)
    
    nombre: str = Field(max_length=100, unique=True, index=True)
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    
    # Relación 1:N consigo mismo (categorías padre-hijo)
    parent_id: Optional[int] = Field(default=None, foreign_key="categorias.id")
    
    # Auditoría y borrado lógico
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    
    # Relaciones ORM
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

### 3.4 Crear `app/modules/productos/models.py`

```python
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.categorias.models import Categoria, ProductoCategoria
    from app.modules.ingredientes.models import Ingrediente, ProductoIngrediente

# Tabla intermedia: Producto-Categoría (N:M)
class ProductoCategoria(SQLModel, table=True):
    """Relación N:M entre Producto y Categoría"""
    __tablename__ = "producto_categoria"
    
    producto_id: Optional[int] = Field(default=None, foreign_key="productos.id", primary_key=True)
    categoria_id: Optional[int] = Field(default=None, foreign_key="categorias.id", primary_key=True)

# Tabla intermedia: Producto-Ingrediente (N:M)
class ProductoIngrediente(SQLModel, table=True):
    """Relación N:M entre Producto e Ingrediente"""
    __tablename__ = "producto_ingrediente"
    
    producto_id: Optional[int] = Field(default=None, foreign_key="productos.id", primary_key=True)
    ingrediente_id: Optional[int] = Field(default=None, foreign_key="ingredientes.id", primary_key=True)

# Modelo principal: Producto
class Producto(SQLModel, table=True):
    """Modelo de Producto con relaciones N:M"""
    __tablename__ = "productos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    nombre: str = Field(max_length=150, unique=True, index=True)
    descripcion: Optional[str] = None
    precio: float = Field(ge=0.0)  # No permite valores negativos
    stock: int = Field(default=0)
    imagen_url: Optional[str] = None
    
    # Auditoría y borrado lógico
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    
    # Relaciones ORM
    categorias: List["Categoria"] = Relationship(
        back_populates="productos",
        link_model=ProductoCategoria
    )
    
    ingredientes: List["Ingrediente"] = Relationship(
        back_populates="productos",
        link_model=ProductoIngrediente
    )
```

### 3.5 Crear `app/modules/ingredientes/models.py`

```python
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone

from app.modules.productos.models import ProductoIngrediente

if TYPE_CHECKING:
    from app.modules.productos.models import Producto

class Ingrediente(SQLModel, table=True):
    """Modelo de Ingrediente"""
    __tablename__ = "ingredientes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    nombre: str = Field(max_length=150, unique=True, index=True)
    
    # Auditoría y borrado lógico
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    
    # Relaciones ORM
    productos: List["Producto"] = Relationship(
        back_populates="ingredientes",
        link_model=ProductoIngrediente
    )
```

---

## 4. Backend - Servicios y Routers

### 4.1 Crear `app/modules/categorias/schemas.py`

```python
from typing import Optional, List
from sqlmodel import SQLModel
from datetime import datetime

# Schema para CREAR una categoría (entrada)
class CategoriaCreate(SQLModel):
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    parent_id: Optional[int] = None

# Schema para ACTUALIZAR (entrada)
class CategoriaUpdate(SQLModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    parent_id: Optional[int] = None

# Schema para LEER (salida)
class CategoriaPublic(SQLModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

# Schema para LISTAR (respuesta paginada)
class CategoriaList(SQLModel):
    data: List[CategoriaPublic]
    total: int
```

### 4.2 Crear `app/modules/categorias/service.py`

```python
from sqlmodel import Session, select
from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaUpdate, CategoriaPublic, CategoriaList
from datetime import datetime, timezone
from fastapi import HTTPException, status

class CategoriaService:
    """Lógica de negocio para Categorías"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, data: CategoriaCreate) -> CategoriaPublic:
        """Crear nueva categoría"""
        categoria = Categoria(
            nombre=data.nombre,
            descripcion=data.descripcion,
            imagen_url=data.imagen_url,
            parent_id=data.parent_id
        )
        self.session.add(categoria)
        self.session.commit()
        self.session.refresh(categoria)
        return CategoriaPublic.model_validate(categoria)
    
    def get_all(self, offset: int = 0, limit: int = 20) -> CategoriaList:
        """Obtener todas las categorías activas (no eliminadas)"""
        # Contar totales
        statement_count = select(Categoria).where(Categoria.deleted_at.is_(None))
        total = len(self.session.exec(statement_count).all())
        
        # Obtener paginados
        statement = select(Categoria).where(Categoria.deleted_at.is_(None)).offset(offset).limit(limit)
        categorias = self.session.exec(statement).all()
        
        return CategoriaList(
            data=[CategoriaPublic.model_validate(c) for c in categorias],
            total=total
        )
    
    def get_by_id(self, categoria_id: int) -> CategoriaPublic:
        """Obtener categoría por ID"""
        statement = select(Categoria).where(
            (Categoria.id == categoria_id) & (Categoria.deleted_at.is_(None))
        )
        categoria = self.session.exec(statement).first()
        
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        return CategoriaPublic.model_validate(categoria)
    
    def update(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaPublic:
        """Actualizar categoría (parcial)"""
        statement = select(Categoria).where(Categoria.id == categoria_id)
        categoria = self.session.exec(statement).first()
        
        if not categoria or categoria.deleted_at:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        # Actualizar solo campos no None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(categoria, key, value)
        
        categoria.updated_at = datetime.now(timezone.utc)
        self.session.add(categoria)
        self.session.commit()
        self.session.refresh(categoria)
        
        return CategoriaPublic.model_validate(categoria)
    
    def soft_delete(self, categoria_id: int) -> None:
        """Soft delete: marcar como eliminada"""
        statement = select(Categoria).where(Categoria.id == categoria_id)
        categoria = self.session.exec(statement).first()
        
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        categoria.deleted_at = datetime.now(timezone.utc)
        self.session.add(categoria)
        self.session.commit()
```

### 4.3 Crear `app/modules/categorias/router.py`

```python
from fastapi import APIRouter, Depends, Query, status, Path
from sqlmodel import Session
from typing import Annotated

from app.core.database import get_session
from app.modules.categorias.schemas import CategoriaCreate, CategoriaPublic, CategoriaUpdate, CategoriaList
from app.modules.categorias.service import CategoriaService

router = APIRouter()

def get_categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
    """Factory de dependencia: inyecta el servicio con su Session"""
    return CategoriaService(session)

# ── ENDPOINTS ──────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=CategoriaPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una categoría"
)
def create_categoria(
    data: CategoriaCreate,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaPublic:
    """Crear nueva categoría"""
    return svc.create(data)

@router.get(
    "/",
    response_model=CategoriaList,
    summary="Listar categorías activas (paginado)"
)
def list_categorias(
    offset: Annotated[int, Query(ge=0, description="Registros a omitir")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Límite por página")] = 20,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaList:
    """Listar todas las categorías con paginación"""
    return svc.get_all(offset=offset, limit=limit)

@router.get(
    "/{categoria_id}",
    response_model=CategoriaPublic,
    summary="Obtener categoría por ID"
)
def get_categoria(
    categoria_id: Annotated[int, Path(ge=1, description="ID de la categoría")],
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaPublic:
    """Obtener categoría específica por su ID"""
    return svc.get_by_id(categoria_id)

@router.patch(
    "/{categoria_id}",
    response_model=CategoriaPublic,
    summary="Actualizar categoría (parcial)"
)
def update_categoria(
    categoria_id: Annotated[int, Path(ge=1, description="ID de la categoría")],
    data: CategoriaUpdate,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaPublic:
    """Actualizar categoría (solo los campos proporcionados)"""
    return svc.update(categoria_id, data)

@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar categoría"
)
def delete_categoria(
    categoria_id: Annotated[int, Path(ge=1, description="ID de la categoría")],
    svc: CategoriaService = Depends(get_categoria_service),
) -> None:
    """Eliminar (soft delete) una categoría"""
    svc.soft_delete(categoria_id)
```

**Nota:** Repetir este proceso para `ingredientes/` y `productos/` con sus respectivos modelos.

### 4.4 Crear `main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_db_and_tables

# 1. Importar modelos para que SQLModel cree las tablas
import app.modules.categorias.models
import app.modules.productos.models
import app.modules.ingredientes.models

# 2. Importar routers
from app.modules.categorias.router import router as categorias_router
from app.modules.productos.router import router as productos_router
from app.modules.ingredientes.router import router as ingredientes_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ejecutar setup al iniciar la app"""
    create_db_and_tables()
    yield

app = FastAPI(
    title="FoodStore API",
    description="API para el parcial - Fullstack",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - Permitir frontend en localhost:5173
origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Incluir routers
app.include_router(categorias_router, prefix="/categorias", tags=["Categorías"])
app.include_router(productos_router, prefix="/productos", tags=["Productos"])
app.include_router(ingredientes_router, prefix="/ingredientes", tags=["Ingredientes"])

@app.get("/")
def root():
    """Endpoint de prueba"""
    return {"message": "FoodStore API - ¡Funcionando!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)
```

### 4.5 Ejecutar el Backend

```bash
# Activar venv (si no está activo)
.venv\Scripts\activate

# Ejecutar uvicorn
uvicorn main:app --reload --port 5000

# O usar:
python -m uvicorn main:app --reload --port 5000
```

**Output esperado:**
```
Uvicorn running on http://127.0.0.1:5000
Press CTRL+C to quit
```

**Acceder a documentación:**
- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

---

## 5. Frontend - Configuración Inicial

### 5.1 Crear proyecto Vite + React + TypeScript

```bash
# Navegar al directorio
cd frontEnd

# Crear proyecto con Vite (opción interactiva)
npm create vite@latest . -- --template react-ts

# O directamente:
npm create vite@latest . -- --template=react-ts --yes
```

### 5.2 Instalar dependencias

```bash
# Instalar dependencias base
npm install

# Instalar TanStack Query (gestión de estado del servidor)
npm install @tanstack/react-query

# Instalar React Router
npm install react-router-dom

# Instalar Tailwind CSS 4
npm install tailwindcss @tailwindcss/vite

# Instalar React Hook Form (formularios)
npm install react-hook-form

# Instalar Lucide Icons
npm install lucide-react
```

### 5.3 Configurar Tailwind CSS

Crear `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Actualizar `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
})
```

### 5.4 Crear archivo CSS global

Actualizar `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5.5 Ejecutar Frontend

```bash
# Instalar dependencias si no lo hizo
npm install

# Ejecutar servidor Vite
npm run dev

# Output esperado:
# Local:        http://localhost:5173/
```

---

## 6. Frontend - Estructura de Carpetas

### 6.1 Crear estructura de carpetas

```
src/
├── assets/                 # Imágenes, iconos, etc.
├── api/                    # Servicios de API
│   ├── axios-config.ts
│   ├── categories.service.ts
│   ├── products.service.ts
│   └── ingredients.service.ts
├── components/
│   ├── NavBar.tsx
│   ├── modals/
│   │   ├── ModalCategories/
│   │   │   └── ModalCategories.tsx
│   │   ├── ModalProducts/
│   │   │   └── ModalProducts.tsx
│   │   ├── ModalIngredients/
│   │   │   └── ModalIngredients.tsx
│   │   └── ConfirmDeleteModal.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Table.tsx
├── hooks/                  # Custom React hooks
│   └── useCustom.ts
├── pages/
│   ├── CategoriasPage.tsx
│   ├── ProductosPage.tsx
│   ├── ProductDetailPage.tsx
│   └── IngredientesPage.tsx
├── routes/
│   └── AppRouter.tsx
├── types/                  # Interfaces TypeScript
│   ├── ICategorie.ts
│   ├── IProduct.ts
│   └── IIngrediente.ts
├── App.tsx
├── main.tsx
└── index.css
```

### 6.2 Crear estructura con comando

```bash
# En frontEnd/src

# Carpetas principales
mkdir -p assets api components/modals/ModalCategories components/modals/ModalProducts components/modals/ModalIngredients components/ui hooks pages routes types

# Crear archivos iniciales
touch api/categories.service.ts
touch components/NavBar.tsx
touch components/modals/ConfirmDeleteModal.tsx
touch pages/CategoriasPage.tsx
touch pages/ProductosPage.tsx
touch pages/ProductDetailPage.tsx
touch pages/IngredientesPage.tsx
touch routes/AppRouter.tsx
touch types/ICategorie.ts
touch types/IProduct.ts
touch types/IIngrediente.ts
```

---

## 7. Frontend - Componentes y Páginas

### 7.1 Crear `src/types/ICategorie.ts`

```typescript
export interface ICategoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  parent_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ICategoriaCreate {
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  parent_id?: number | null;
}

export interface ICategoriaList {
  data: ICategoria[];
  total: number;
}
```

### 7.2 Crear `src/types/IProduct.ts`

```typescript
import type { ICategoria } from "./ICategorie";
import type { IIngrediente } from "./IIngrediente";

export interface IProduct {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen_url?: string | null;
  categorias: ICategoria[];
  ingredientes: IIngrediente[];
}

export interface IProductCreate {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen_url?: string | null;
  categoria_ids?: number[];
  ingrediente_ids?: number[];
}

export interface IProductList {
  data: IProduct[];
  total: number;
}
```

### 7.3 Crear `src/types/IIngrediente.ts`

```typescript
export interface IIngrediente {
  id: number;
  nombre: string;
  created_at: string;
  updated_at: string;
}

export interface IIngredienteCreate {
  nombre: string;
}

export interface IIngredienteList {
  data: IIngrediente[];
  total: number;
}
```

### 7.4 Crear `src/routes/AppRouter.tsx`

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { CategoriasPage } from '../pages/CategoriasPage';
import { ProductosPage } from '../pages/ProductosPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { IngredientesPage } from '../pages/IngredientesPage';
import { NavBar } from "../components/NavBar";

export const AppRouter = () => {
  return (
    <>
      <NavBar />
      <main className="container mx-auto p-6">
        <Routes>
          {/* Redireccionar raíz a categorías */}
          <Route path="/" element={<Navigate to="/categorias" />} />
          
          {/* Rutas principales */}
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/ingredientes" element={<IngredientesPage />} />
          
          {/* 404 */}
          <Route path="*" element={<div>404 - Página no encontrada</div>} />
        </Routes>
      </main>
    </>
  );
};
```

### 7.5 Crear `src/components/NavBar.tsx`

```typescript
import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

export const NavBar = () => {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <UtensilsCrossed size={28} />
          FoodStore
        </Link>
        
        <div className="flex gap-6">
          <Link to="/categorias" className="hover:text-blue-200 transition">
            Categorías
          </Link>
          <Link to="/productos" className="hover:text-blue-200 transition">
            Productos
          </Link>
          <Link to="/ingredientes" className="hover:text-blue-200 transition">
            Ingredientes
          </Link>
        </div>
      </div>
    </nav>
  );
};
```

### 7.6 Crear `src/App.tsx`

```typescript
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "./routes/AppRouter";

// Crear cliente de TanStack Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

### 7.7 Crear `src/pages/CategoriasPage.tsx`

```typescript
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategorias, deleteCategoria } from "../api/categories.service";
import type { ICategoria } from "../types/ICategorie";
import { ModalCategories } from "../components/modals/ModalCategories/ModalCategories";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";

export const CategoriasPage = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const LIMIT = 5;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState<ICategoria | undefined>(undefined);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [categoriaIdToDelete, setCategoriaIdToDelete] = useState<number | null>(null);

  // TanStack Query: LECTURA
  const { data: categoriasData, isLoading, isError } = useQuery({
    queryKey: ["categorias", page],
    queryFn: () => getCategorias(page * LIMIT, LIMIT),
  });

  const totalItems = categoriasData?.total || 0;
  const totalPages = Math.ceil(totalItems / LIMIT);

  // TanStack Query: MUTACIÓN para borrado
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: () => {
      // ✨ INVALIDAR CACHÉ para refrescar datos
      queryClient.invalidateQueries({ queryKey: ["categorias"] });

      setMensajeExito("Categoría eliminada correctamente");
      setTimeout(() => setMensajeExito(null), 3000);
    },
  });

  const handleOpenModal = (categoria?: ICategoria) => {
    setCategoriaToEdit(categoria);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoriaToEdit(undefined);
  };

  const handleDelete = (id: number) => {
    setCategoriaIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoriaIdToDelete !== null) {
      deleteMutation.mutate(categoriaIdToDelete);
      setIsDeleteConfirmOpen(false);
      setCategoriaIdToDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona las categorías de tu menú</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          + Añadir Categoría
        </button>
      </div>

      {isLoading && <div className="text-center py-10 text-gray-500">Cargando...</div>}
      {isError && <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">Error al cargar datos</div>}

      {categoriasData && categoriasData.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categoriasData.data.map((cat) => (
                <tr key={cat.id} className="hover:bg-blue-50 transition">
                  <td className="py-3 px-4 text-sm text-gray-500">#{cat.id}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{cat.nombre}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{cat.descripcion || "-"}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="text-blue-600 hover:text-blue-800 font-medium mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? "Borrando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="mt-6 flex items-center justify-between pt-4">
            <span className="text-sm text-gray-600">
              Página <strong>{page + 1}</strong> de <strong>{totalPages || 1}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((old) => Math.max(old - 1, 0))}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => page + 1 < totalPages && setPage((old) => old + 1)}
                disabled={page + 1 >= totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <ModalCategories isOpen={isModalOpen} onClose={handleCloseModal} categoriaToEdit={categoriaToEdit} />
      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Eliminar categoría"
        message="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        isLoading={deleteMutation.isPending}
      />

      {mensajeExito && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {mensajeExito}
        </div>
      )}
    </div>
  );
};
```

---

## 8. Frontend - Integración con API

### 8.1 Crear `src/api/categories.service.ts`

```typescript
import type { ICategoria, ICategoriaCreate, ICategoriaList } from "../types/ICategorie";

const API_URL = "http://localhost:5000";

export const getCategorias = async (offset: number, limit: number): Promise<ICategoriaList> => {
  const response = await fetch(`${API_URL}/categorias?offset=${offset}&limit=${limit}`);
  if (!response.ok) throw new Error("Error fetching categories");
  return response.json();
};

export const getCategoriaById = async (id: number): Promise<ICategoria> => {
  const response = await fetch(`${API_URL}/categorias/${id}`);
  if (!response.ok) throw new Error("Error fetching category");
  return response.json();
};

export const createCategoria = async (data: ICategoriaCreate): Promise<ICategoria> => {
  const response = await fetch(`${API_URL}/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating category");
  return response.json();
};

export const updateCategoria = async (id: number, data: Partial<ICategoriaCreate>): Promise<ICategoria> => {
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating category");
  return response.json();
};

export const deleteCategoria = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error deleting category");
};
```

**Repetir para `products.service.ts` e `ingredients.service.ts`**

### 8.2 Crear Modal de Categorías

Crear `src/components/modals/ModalCategories/ModalCategories.tsx`:

```typescript
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategoria, updateCategoria } from "../../../api/categories.service";
import type { ICategoria, ICategoriaCreate } from "../../../types/ICategorie";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categoriaToEdit?: ICategoria;
}

export const ModalCategories = ({ isOpen, onClose, categoriaToEdit }: Props) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ICategoriaCreate>({
    nombre: "",
    descripcion: "",
    imagen_url: "",
  });

  useEffect(() => {
    if (categoriaToEdit) {
      setFormData({
        nombre: categoriaToEdit.nombre,
        descripcion: categoriaToEdit.descripcion || "",
        imagen_url: categoriaToEdit.imagen_url || "",
      });
    } else {
      setFormData({ nombre: "", descripcion: "", imagen_url: "" });
    }
  }, [categoriaToEdit, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: ICategoriaCreate) => createCategoria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ICategoriaCreate) => updateCategoria(categoriaToEdit!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoriaToEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {categoriaToEdit ? "Editar Categoría" : "Nueva Categoría"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-4"
            required
          />

          <textarea
            placeholder="Descripción"
            value={formData.descripcion || ""}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-4"
            rows={3}
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {categoriaToEdit ? "Guardar" : "Crear"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 9. Integración Backend-Frontend

### 9.1 Verificar CORS

En `main.py` asegurarse de que CORS permite `http://localhost:5173`:

```python
origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 9.2 Ejecutar ambos servidores

**Terminal 1 - Backend:**
```bash
cd BackEnd
.venv\Scripts\activate
uvicorn main:app --reload --port 5000
```

**Terminal 2 - Frontend:**
```bash
cd frontEnd
npm run dev
```

### 9.3 Verificar comunicación

1. Abrir http://localhost:5173 en navegador
2. Ir a DevTools → Network → crear una nueva categoría
3. Verificar que se envía request a http://localhost:5000/categorias (POST)
4. Verificar response: 201 Created con ID de la categoría

---

## 10. Testing y Deployment

### 10.1 Testing del Backend

Crear `BackEnd/test/test_categorias.py`:

```python
import pytest
from sqlmodel import Session
from app.modules.categorias.models import Categoria
from app.modules.categorias.service import CategoriaService
from app.modules.categorias.schemas import CategoriaCreate

@pytest.fixture
def session():
    # Mock session para testing
    pass

def test_create_categoria(session: Session):
    service = CategoriaService(session)
    data = CategoriaCreate(nombre="Test", descripcion="Test desc")
    # Assertions...
    pass
```

### 10.2 Testing del Frontend

Crear test con Vitest (opcional):

```bash
npm install -D vitest @testing-library/react
```

### 10.3 Build para Producción

**Backend:**
```bash
# El backend está listo para deployar
# Usar gunicorn en producción:
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

**Frontend:**
```bash
# Buildear para producción
npm run build

# Genera carpeta dist/ lista para servir con Nginx, Vercel, etc.
```

---

## ✅ Checklist de Implementación

```
BACKEND:
✅ Crear venv y instalar dependencias
✅ Crear estructura modular (core, modules)
✅ Implementar modelos SQLModel con Relationships
✅ Crear schemas (Create, Update, Public, List)
✅ Implementar servicios con lógica de negocio
✅ Crear routers con endpoints CRUD
✅ Configurar CORS para frontend
✅ Ejecutar uvicorn --reload

FRONTEND:
✅ Crear proyecto Vite + React + TypeScript
✅ Instalar TanStack Query, React Router, Tailwind
✅ Crear estructura de carpetas (components, pages, types, api)
✅ Crear tipos/interfaces TypeScript
✅ Crear servicios de API
✅ Crear páginas con useQuery y useMutation
✅ Crear modales y componentes reutilizables
✅ Configurar React Router con rutas dinámicas
✅ Ejecutar npm run dev

INTEGRACIÓN:
✅ Ambos servidores ejecutándose
✅ Network requests funcionando (DevTools)
✅ Crear/Leer/Actualizar/Borrar funcionando
✅ Invalidación de caché automática
✅ Validaciones en frontend y backend
✅ Manejo de errores y estados de carga
```

---

## 🎯 Resumen

Este guión proporciona **instrucciones paso a paso** para crear una aplicación fullstack completa desde cero:

1. **Backend profesional** con arquitectura modular, validaciones y persistencia
2. **Frontend moderno** con componentes reutilizables, state management y routing
3. **Integración** entre ambos lados con APIs REST e invalidación de caché

Siguiendo este flujo, tendrás una **base sólida** para expandir la aplicación con más funcionalidades.

¡Éxito! 🚀

