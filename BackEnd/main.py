from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_db_and_tables

# 1. IMPORTANTE: Importamos el modelo de Categoría para que SQLModel cree la tabla
import app.modules.categorias.models
import app.modules.productos.models
import app.modules.ingredientes.models

# 2. Importamos nuestro nuevo router
from app.modules.categorias.router import router as categorias_router
from app.modules.productos.router import router as productos_router
from app.modules.ingredientes.router import router as ingredientes_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title="FoodStore API",
    description="API para el parcial",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Conectamos el router a la aplicación
app.include_router(categorias_router, prefix="/categorias", tags=["Categorias"])
app.include_router(productos_router, prefix="/productos", tags=["Productos"])
app.include_router(ingredientes_router, prefix="/ingredientes", tags=["Ingredientes"])