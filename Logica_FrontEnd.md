# 🎯 LÓGICA FRONTEND - Orden de Codificación

**Objetivo:** Entender el flujo lógico de cómo se construye el frontend paso a paso.

---

## 📋 Índice de Orden de Codificación

1. [Tipos TypeScript](#1-tipos-typescript)
2. [Configuración de Routing](#2-configuración-de-routing)
3. [Servicios de API](#3-servicios-de-api)
4. [Componentes Base](#4-componentes-base)
5. [Páginas principales](#5-páginas-principales)
6. [Modales y UI](#6-modales-y-ui)
7. [Integración de TanStack Query](#7-integración-de-tanstack-query)
8. [Testing de integración](#8-testing-de-integración)

---

## 🔹 1. Tipos TypeScript

### ¿Por qué primero?

TypeScript necesita **definiciones de tipos** antes de usarlos. Los tipos son la base para toda la comunicación con el backend.

### Paso 1.1: `src/types/ICategorie.ts`

```typescript
// Interface = contrato de datos
// ICategoria = lo que VIENE DEL BACKEND (GET)

export interface ICategoria {
  id: number;
  nombre: string;
  descripcion?: string | null;  // ? = opcional, | null = puede ser null
  imagen_url?: string | null;
  parent_id?: number | null;
  created_at: string;  // ISO 8601 date
  updated_at: string;
}

// ICategoriaCreate = lo que ENVIAMOS AL BACKEND (POST/PATCH)
export interface ICategoriaCreate {
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  parent_id?: number | null;
}

// ICategoriaList = respuesta paginada
export interface ICategoriaList {
  data: ICategoria[];
  total: number;
}

// ¿Por qué no incluir id en Create?
// - El servidor lo genera automáticamente
// - El usuario no puede establecer el ID

// ¿Por qué timestamps solo en ICategoria?
// - Los timestamps vienen del servidor en GET
// - No los enviamos en POST/PATCH
```

**Flujo de tipos:**

```
USUARIO COMPLETA FORM
  ↓
ICategoriaCreate {nombre, descripcion}
  ↓
fetch POST /categorias
  ↓
Respuesta: ICategoria {id, nombre, descripcion, created_at}
  ↓
TYPESCRIPT VALIDA
  ↓
useState<ICategoria> guardar
```

### Paso 1.2: `src/types/IProduct.ts`

```typescript
import type { ICategoria } from "./ICategorie";
import type { IIngrediente } from "./IIngrediente";

// LECTURA: Producto con todas sus relaciones
export interface IProduct {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen_url?: string | null;
  
  // Relaciones: el backend devuelve objetos completos
  categorias: ICategoria[];      // N categorías
  ingredientes: IIngrediente[];  // N ingredientes
}

// CREACIÓN: No mandamos relaciones como objetos, solo IDs
export interface IProductCreate {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen_url?: string | null;
  
  categoria_ids?: number[];      // [1, 2, 3]
  ingrediente_ids?: number[];    // [5, 6]
}

// LISTADO
export interface IProductList {
  data: IProduct[];
  total: number;
}

// ¿Por qué categoria_ids en Create pero categorias en Product?
// - POST: enviamos IDs (pequeño payload)
// - GET: recibimos objetos (para mostrar nombre, etc)
```

**Visualización:**

```
POST /productos:
{
  "nombre": "Café",
  "precio": 2.50,
  "categoria_ids": [1, 2]  ← Solo IDs
}

GET /productos/1:
{
  "id": 1,
  "nombre": "Café",
  "precio": 2.50,
  "categorias": [          ← Objetos completos
    {id: 1, nombre: "Bebidas"},
    {id: 2, nombre: "Cálidas"}
  ]
}
```

### Paso 1.3: `src/types/IIngrediente.ts`

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

**Ventaja TypeScript:**

```typescript
// SIN tipos:
const cat = getCategorias();
cat.nombre  // ¿Existe? ¿Es string? ¿Y si typo?

// CON tipos:
const cat: ICategoria = getCategorias();
cat.nombre  // ✓ TypeScript garantiza: existe, es string
cat.nonmbre // ✗ ERROR EN COMPILACIÓN (typo)
```

---

## 🔹 2. Configuración de Routing

### ¿Por qué segundo?

El **routing define la navegación**. Debe estar listo antes de crear páginas.

### Paso 2.1: `src/routes/AppRouter.tsx`

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { CategoriasPage } from '../pages/CategoriasPage';
import { ProductosPage } from '../pages/ProductosPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { IngredientesPage } from '../pages/IngredientesPage';
import { NavBar } from "../components/NavBar";

export const AppRouter = () => {
  // ¿Por qué AppRouter es un componente separado?
  // - Centraliza todas las rutas
  // - Fácil mantener/agregar rutas
  // - Separa routing logic de App.tsx
  
  return (
    <>
      <NavBar />  {/* Navbar en TODAS las páginas */}
      
      <main className="container mx-auto p-6">
        <Routes>
          {/* RUTA RAÍZ: redirige a /categorias */}
          <Route path="/" element={<Navigate to="/categorias" />} />
          
          {/* RUTAS PRINCIPALES: listados */}
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/ingredientes" element={<IngredientesPage />} />
          
          {/* RUTA DINÁMICA: detalle de un producto */}
          <Route path="/products/:id" element={<ProductDetailPage />} />
          {/* :id = parámetro dinámico
              /products/1 → id = "1"
              /products/5 → id = "5"
          */}
          
          {/* 404: cualquier ruta no definida */}
          <Route path="*" element={<div>404 - Página no encontrada</div>} />
        </Routes>
      </main>
    </>
  );
};
```

**Visualización de rutas:**

```
http://localhost:5173/
  ↓ (Navigate)
http://localhost:5173/categorias
  ↓ (CategoriasPage)

http://localhost:5173/productos/1
  ↓ (ProductDetailPage)
  ↓ (useParams() extrae id = "1")

http://localhost:5173/ingredientes
  ↓ (IngredientesPage)
```

### Paso 2.2: `src/App.tsx`

```typescript
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "./routes/AppRouter";

// TanStack Query: crea cliente global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,  // Reintentar 1 vez si falla
      staleTime: 1000 * 60 * 5,  // Cache 5 minutos
    },
  },
});

function App() {
  // Estructura:
  // BrowserRouter: activa react-router (routing en navegador)
  // QueryClientProvider: activa TanStack Query (state management)
  // AppRouter: define todas las rutas
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

// ¿Por qué nested providers?
// Cada one es un "contexto global":
// - BrowserRouter: permite routing
// - QueryClientProvider: permite useQuery/useMutation
// - AppRouter: define dónde renderizar
```

**Flujo de providers:**

```
App
  ↓
QueryClientProvider
  ↓ (proporciona queryClient)
BrowserRouter
  ↓ (proporciona routing)
AppRouter
  ↓ (proporciona rutas)
<CategoriasPage />
  ↓
useQuery (accede al queryClient)
useMutation (accede al queryClient)
```

---

## 🔹 3. Servicios de API

### ¿Por qué tercero?

Los **servicios de API encapsulan las llamadas fetch**. Así la página no necesita conocer URLs.

### Paso 3.1: `src/api/categories.service.ts`

```typescript
import type { ICategoria, ICategoriaCreate, ICategoriaList } from "../types/ICategorie";

// Centralizar URL base para fácil cambio
const API_URL = "http://localhost:5000";

// ━━━━━━━━ GET: LISTAR ━━━━━━━━

export const getCategorias = async (
  offset: number,
  limit: number
): Promise<ICategoriaList> => {
  // URL: http://localhost:5000/categorias?offset=0&limit=20
  const response = await fetch(
    `${API_URL}/categorias?offset=${offset}&limit=${limit}`
  );
  
  // ¿Por qué throw si no ok?
  // useQuery captura el error automáticamente
  if (!response.ok) throw new Error("Error fetching categories");
  
  return response.json();  // Espera ICategoriaList
};

// ¿Por qué async?
// fetch devuelve Promise, necesita await
// El servicio también devuelve Promise para poder useQuery

// ━━━━━━━━ GET: LEER UNO ━━━━━━━━

export const getCategoriaById = async (id: number): Promise<ICategoria> => {
  const response = await fetch(`${API_URL}/categorias/${id}`);
  if (!response.ok) throw new Error("Error fetching category");
  return response.json();
};

// ━━━━━━━━ POST: CREAR ━━━━━━━━

export const createCategoria = async (
  data: ICategoriaCreate
): Promise<ICategoria> => {
  // POST requiere método + headers + body
  const response = await fetch(`${API_URL}/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),  // ICategoriaCreate → JSON string
  });
  
  if (!response.ok) throw new Error("Error creating category");
  return response.json();  // Espera ICategoria
};

// ¿Por qué JSON.stringify?
// fetch requiere string, no objeto
// JSON.stringify convierte {nombre: "Café"} → '{"nombre":"Café"}'

// ━━━━━━━━ PATCH: ACTUALIZAR ━━━━━━━━

export const updateCategoria = async (
  id: number,
  data: Partial<ICategoriaCreate>  // Partial = TODO es opcional
): Promise<ICategoria> => {
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: "PATCH",  // PATCH = actualizar parcialmente
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error("Error updating category");
  return response.json();
};

// ━━━━━━━━ DELETE: ELIMINAR ━━━━━━━━

export const deleteCategoria = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) throw new Error("Error deleting category");
  // 204 No Content: no hay response.json()
};

// Resumen de servicios:
// - Todos son async
// - Todos retornan Promise<tipo>
// - Todos lanzan error si no ok
// - Todos usan type-safe interfaces
```

**Flujo de servicio:**

```
CategoriasPage
  ↓
useQuery({
  queryFn: () => getCategorias(0, 20)  ← llama servicio
})
  ↓
getCategorias(0, 20)
  ↓
fetch("http://localhost:5000/categorias?offset=0&limit=20")
  ↓
JSON → Promise<ICategoriaList>
  ↓
Devuelve a useQuery
  ↓
useQuery actualiza state
  ↓
Componente re-renderiza
```

---

## 🔹 4. Componentes Base

### ¿Por qué cuarto?

Los **componentes base son reutilizables**. NavBar, modales, etc. van primero.

### Paso 4.1: `src/components/NavBar.tsx`

```typescript
import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

export const NavBar = () => {
  // Componente SIMPLE: no lógica, solo rendering
  
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* LOGO + TITULO */}
        <Link 
          to="/"  {/* Navega a raíz */}
          className="flex items-center gap-2 font-bold text-xl"
        >
          <UtensilsCrossed size={28} />  {/* Icono de Lucide */}
          FoodStore
        </Link>
        
        {/* NAVEGACIÓN */}
        <div className="flex gap-6">
          <Link 
            to="/categorias"
            className="hover:text-blue-200 transition"
          >
            Categorías
          </Link>
          
          <Link 
            to="/productos"
            className="hover:text-blue-200 transition"
          >
            Productos
          </Link>
          
          <Link 
            to="/ingredientes"
            className="hover:text-blue-200 transition"
          >
            Ingredientes
          </Link>
        </div>
      </div>
    </nav>
  );
};

// ¿Por qué Link en vez de <a>?
// - <a href> hace refresh de toda la página
// - Link de React Router cambia URL sin refrescar (SPA)
// - Mantiene state local

// ¿Por qué Lucide icons?
// - Iconos como componentes React
// - Controlables con props (size, color, etc)
```

### Paso 4.2: `src/components/modals/ConfirmDeleteModal.tsx`

```typescript
interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDeleteModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}: Props) => {
  // Modal reutilizable: acepta title y message como props
  
  // ¿Por qué no renderizar si no está open?
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Backdrop semi-transparente */}
      
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        {/* Modal content */}
        
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Eliminando..." : "Confirmar"}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// Props interface:
// - Tipado explícito
// - Autocomplete en editor
// - Errores en compilación (no runtime)
```

---

## 🔹 5. Páginas Principales

### ¿Por qué quinto?

Las **páginas usan servicios + componentes**. No se pueden crear hasta que ambos existan.

### Paso 5.1: `src/pages/CategoriasPage.tsx`

```typescript
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategorias, deleteCategoria } from "../api/categories.service";
import type { ICategoria } from "../types/ICategorie";
import { ModalCategories } from "../components/modals/ModalCategories/ModalCategories";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";

export const CategoriasPage = () => {
  // ━━━━━━━━ ESTADO LOCAL ━━━━━━━━
  
  const queryClient = useQueryClient();  // Accede a caché de TanStack
  const [page, setPage] = useState(0);   // Página actual (0-indexada)
  const LIMIT = 5;                       // Items por página
  
  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState<ICategoria | undefined>(undefined);
  
  // Feedback visual
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  
  // Confirmación de delete
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [categoriaIdToDelete, setCategoriaIdToDelete] = useState<number | null>(null);
  
  // ¿Por qué useState para todo?
  // - Re-renderizar cuando cambia
  // - React mantiene sincronizado con UI
  
  // ━━━━━━━━ TANSTACK QUERY: LECTURA (GET) ━━━━━━━━
  
  const { data: categoriasData, isLoading, isError } = useQuery({
    queryKey: ["categorias", page],  // Cache key
    // ¿Por qué [categorias, page]?
    // - ["categorias"] → página 0
    // - ["categorias", 0] → distintos datos
    // - ["categorias", 1] → distintos datos
    // TanStack mantiene cache separada por key
    
    queryFn: () => getCategorias(page * LIMIT, LIMIT),
    // queryFn = función que trae datos
    // Se llama automáticamente si:
    // - Componente monta
    // - queryKey cambia
    // - staleTime expira
    // - invalidateQueries es llamado
  });
  
  // Desestructuring: obtenemos lo que necesitamos
  // - data: respuesta del servidor
  // - isLoading: true mientras carga
  // - isError: true si hubo error
  
  // Lógica de paginación
  const totalItems = categoriasData?.total || 0;
  const totalPages = Math.ceil(totalItems / LIMIT);
  // ?.total = optional chaining (si null/undefined, retorna undefined)
  
  // ━━━━━━━━ TANSTACK QUERY: MUTACIÓN (DELETE) ━━━━━━━━
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    // mutationFn = función que ejecuta la acción
    
    onSuccess: () => {
      // Callback: ejecuta si la mutación es exitosa
      
      // ✨ INVALIDAR CACHÉ ✨
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      // Esto dice: "categoria cache está vieja, vuelve a traer datos"
      // TanStack automáticamente hace nuevamente queryFn
      // Componente re-renderiza con datos nuevos
      
      // Feedback visual
      setMensajeExito("Categoría eliminada correctamente");
      setTimeout(() => setMensajeExito(null), 3000);
    },
    
    onError: (error) => {
      // Callback: ejecuta si hay error
      console.error("Error:", error);
      // Mostrar toast error (opcional)
    },
  });
  
  // ¿Por qué onSuccess + invalidateQueries?
  // Patrón: mutate → servidor actualiza → invalidar caché → refetch
  // Result: UI siempre sincronizada con servidor
  
  // ━━━━━━━━ HANDLERS ━━━━━━━━
  
  const handleOpenModal = (categoria?: ICategoria) => {
    // Abre modal de crear (sin categoria) o editar (con categoria)
    setCategoriaToEdit(categoria);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoriaToEdit(undefined);
  };
  
  const handleDelete = (id: number) => {
    // Abre modal de confirmación
    setCategoriaIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  };
  
  const handleConfirmDelete = () => {
    // Ejecuta la mutación (DELETE)
    if (categoriaIdToDelete !== null) {
      deleteMutation.mutate(categoriaIdToDelete);
      setIsDeleteConfirmOpen(false);
      setCategoriaIdToDelete(null);
    }
  };
  
  // ━━━━━━━━ RENDER ━━━━━━━━
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona las categorías</p>
        </div>
        <button
          onClick={() => handleOpenModal()}  // Crear sin categoría
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium"
        >
          + Añadir Categoría
        </button>
      </div>
      
      {/* ESTADO: CARGANDO */}
      {isLoading && (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      )}
      
      {/* ESTADO: ERROR */}
      {isError && (
        <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">
          Ocurrió un error al cargar
        </div>
      )}
      
      {/* TABLA: CONTENIDO */}
      {categoriasData && categoriasData.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categoriasData.data.map((cat) => (
                <tr key={cat.id} className="hover:bg-blue-50">
                  <td className="py-3 px-4">#{cat.id}</td>
                  <td className="py-3 px-4 font-medium">{cat.nombre}</td>
                  <td className="py-3 px-4">{cat.descripcion || "-"}</td>
                  <td className="py-3 px-4 text-right">
                    {/* EDITAR */}
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Editar
                    </button>
                    
                    {/* ELIMINAR */}
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleteMutation.isPending}  // Deshabilitar si está borrando
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? "Borrando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* PAGINACIÓN */}
          <div className="mt-6 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Página {page + 1} de {totalPages}
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => setPage(old => Math.max(old - 1, 0))}
                disabled={page === 0}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Anterior
              </button>
              
              <button
                onClick={() => page + 1 < totalPages && setPage(old => old + 1)}
                disabled={page + 1 >= totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ESTADO: VACÍO */}
      {categoriasData && categoriasData.data.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No hay categorías. ¡Crea la primera!
        </div>
      )}
      
      {/* MODALES */}
      <ModalCategories 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categoriaToEdit={categoriaToEdit}
      />
      
      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Eliminar categoría"
        message="¿Estás seguro? No se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        isLoading={deleteMutation.isPending}
      />
      
      {/* TOAST: ÉXITO */}
      {mensajeExito && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {mensajeExito}
        </div>
      )}
    </div>
  );
};
```

**Flujo de CategoriasPage:**

```
Monta componente
  ↓
useQuery([categorias, 0])
  ↓
getCategorias(0, 5)
  ↓
fetch backend
  ↓
Respuesta: ICategoriaList
  ↓
setState data
  ↓
Renderiza tabla
  ↓
Usuario hace click en "Eliminar"
  ↓
handleDelete(id)
  ↓
Muestra modal confirmación
  ↓
Usuario confirma
  ↓
deleteMutation.mutate(id)
  ↓
deleteCategoria(id)
  ↓
fetch DELETE
  ↓
onSuccess callback
  ↓
invalidateQueries([categorias])
  ↓
useQuery([categorias, 0]) corre de nuevo
  ↓
Datos se refrescan
  ↓
Componente re-renderiza
  ↓
Tabla sin la categoría deletada
```

---

## 🔹 6. Modales y UI

### ¿Por qué sexto?

Los **modales reutilizar servicios y tipos**. Necesitan existir para ser usados en páginas.

### Paso 6.1: `src/components/modals/ModalCategories/ModalCategories.tsx`

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
  
  // ━━━━━━━━ ESTADO LOCAL DEL FORMULARIO ━━━━━━━━
  
  const [formData, setFormData] = useState<ICategoriaCreate>({
    nombre: "",
    descripcion: "",
    imagen_url: "",
  });
  
  // ¿Por qué formData es tipo ICategoriaCreate?
  // - Son exactamente los campos que enviamos al backend
  // - TypeScript valida que tenemos todos
  // - Autocomplete en el editor
  
  // ━━━━━━━━ EFECTO: LLENAR FORMULARIO SI EDITA ━━━━━━━━
  
  useEffect(() => {
    // Corre cuando isOpen o categoriaToEdit cambia
    
    if (categoriaToEdit) {
      // MODO EDICIÓN: llenar form con datos
      setFormData({
        nombre: categoriaToEdit.nombre,
        descripcion: categoriaToEdit.descripcion || "",
        imagen_url: categoriaToEdit.imagen_url || "",
      });
    } else {
      // MODO CREAR: limpiar form
      setFormData({
        nombre: "",
        descripcion: "",
        imagen_url: "",
      });
    }
  }, [categoriaToEdit, isOpen]);
  
  // ¿Por qué [categoriaToEdit, isOpen]?
  // - Dependencias: si algo aquí cambia, re-ejecuta el efecto
  // - Permite pasar de crear a editar y viceversa
  
  // ━━━━━━━━ MUTACIONES ━━━━━━━━
  
  const createMutation = useMutation({
    mutationFn: (data: ICategoriaCreate) => createCategoria(data),
    onSuccess: () => {
      // Invalidar caché
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      // Cerrar modal
      onClose();
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: ICategoriaCreate) => updateCategoria(categoriaToEdit!.id, data),
    // categoriaToEdit! = le digo a TypeScript: "confía, existe"
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      onClose();
    },
  });
  
  // ━━━━━━━━ HANDLERS ━━━━━━━━
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();  // No hacer submit HTML tradicional
    
    if (categoriaToEdit) {
      // EDITAR
      updateMutation.mutate(formData);
    } else {
      // CREAR
      createMutation.mutate(formData);
    }
  };
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.currentTarget;
    
    // Actualizar formData solo el campo que cambió
    setFormData(prev => ({
      ...prev,
      [name]: value,  // [nombre] = value (clave dinámicamente)
    }));
  };
  
  // ¿Por qué ...prev?
  // - Spread operator: mantiene otros campos
  // - [name]: value: actualiza solo el que cambió
  // - Resultado: shallow merge
  
  // ━━━━━━━━ RENDER ━━━━━━━━
  
  if (!isOpen) return null;  // No renderizar si está cerrado
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Backdrop */}
      
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <h2 className="text-xl font-bold mb-4">
          {categoriaToEdit ? "Editar Categoría" : "Nueva Categoría"}
        </h2>
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* INPUT: Nombre (REQUERIDO) */}
          <input
            type="text"
            placeholder="Nombre *"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
            required
          />
          
          {/* TEXTAREA: Descripción */}
          <textarea
            placeholder="Descripción"
            name="descripcion"
            value={formData.descripcion || ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
            rows={3}
          />
          
          {/* INPUT: URL Imagen */}
          <input
            type="text"
            placeholder="URL Imagen"
            name="imagen_url"
            value={formData.imagen_url || ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mb-4"
          />
          
          {/* BOTONES */}
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

**Flujo del modal:**

```
1. Usuario hace click "+ Añadir"
  ↓ handleOpenModal()
  ↓ categoriaToEdit = undefined
  ↓ isModalOpen = true

2. Modal monta
  ↓ useEffect corre
  ↓ formData = {nombre: "", descripcion: "", imagen_url: ""}

3. Usuario escribe "Bebidas"
  ↓ handleChange(e)
  ↓ formData.nombre = "Bebidas"

4. Usuario hace click "Crear"
  ↓ handleSubmit(e)
  ↓ e.preventDefault()
  ↓ createMutation.mutate(formData)
  ↓ createCategoria({nombre: "Bebidas", ...})
  ↓ fetch POST /categorias
  ↓ onSuccess callback
  ↓ invalidateQueries([categorias])
  ↓ onClose()
  ↓ Modal se cierra
  ↓ Tabla se refresca automáticamente
```

---

## 🔹 7. Integración de TanStack Query

### ¿Por qué séptimo?

TanStack Query es la **columna vertebral** del manejo de estado. Se usa en páginas y modales.

### Conceptos clave:

```typescript
// QUERY: Traer datos (GET)
const { data, isLoading, isError } = useQuery({
  queryKey: ["key"],      // Cache key (único)
  queryFn: async () => {  // Función que trae datos
    return fetch(...).then(r => r.json());
  },
  staleTime: 5 * 60 * 1000,  // Cache válido 5 min
  retry: 1,               // Reintentar 1 vez si falla
});

// MUTATION: Cambiar datos (POST, PATCH, DELETE)
const mutation = useMutation({
  mutationFn: (data) => {  // Función que envía datos
    return fetch(..., {body: JSON.stringify(data)});
  },
  onSuccess: () => {       // Qué hacer si éxito
    queryClient.invalidateQueries({queryKey: ["key"]});
  },
  onError: (error) => {    // Qué hacer si error
    console.error(error);
  },
});

// INVALIDAR CACHÉ: Refrescar datos
queryClient.invalidateQueries({queryKey: ["categories"]});
// "categories" caché está viejo, refetch cuando se necesite

// USAR MUTATION
mutation.mutate(data);          // Ejecutar
mutation.isPending              // true mientras procesa
mutation.isError                // true si hubo error
```

**Ventajas de TanStack Query:**

| Sin TanStack | Con TanStack |
|-------------|-------------|
| `setState(data)` manual | Caché automático |
| Loading/error en cada lugar | Hooks reutilizables |
| Race conditions | Deduplicación automática |
| Refetch manual | Invalidación inteligente |

---

## 🔹 8. Testing de Integración

### ¿Por qué octavo?

Una vez todo construido, **verificar que todo funciona** juntos.

### Paso 8.1: Prueba manual

```
1. npm run dev
2. Abrir http://localhost:5173
3. DevTools → Network tab
4. Crear categoría → Ver POST request a http://localhost:5000/categorias
5. Response: 201 + JSON con id
6. Tabla se actualiza automáticamente
7. Click editar → Modal con datos
8. Click eliminar → Confirmación → DELETE request
9. Response: 204
10. Tabla sin la categoría
```

### Paso 8.2: Validar sincronización

```
1. Abrir dos tabs con http://localhost:5173
2. En tab 1: crear "Café"
3. En tab 2: cambiar de página y volver (fuerza refetch)
4. Tab 2 debe mostrar "Café"  ← datos sincronizados
```

### Paso 8.3: Validar errores

```
1. Cerrar backend (detener uvicorn)
2. Try crear categoría
3. Error visible en UI: "Error al cargar datos"
4. Reabrir backend
5. Refetch automático cuando backend vuelve
```

---

## 📊 Resumen del Orden

| Paso | Archivo | ¿Por qué? | Depende de |
|------|---------|-----------|-----------|
| 1 | `types/*.ts` | Define contratos de datos | TypeScript |
| 2 | `routes/AppRouter.tsx` | Define navegación | types |
| 3 | `api/*.service.ts` | Encapsula API calls | types |
| 4 | `components/NavBar.tsx` | Componente base | routes |
| 5 | `pages/*.Page.tsx` | Usa servicios + hooks | services + types |
| 6 | `modals/Modal*.tsx` | Usa mutaciones | services |
| 7 | `App.tsx` + `main.tsx` | Ensambla todo | routers + queries |
| 8 | Testing | Valida integración | App completa |

---

## 🎯 Lógica de Dependencias Frontend

```
App.tsx
  ↓
└─ QueryClientProvider + BrowserRouter
    ↓
    └─ AppRouter.tsx
        ↓
        ├─ NavBar (sin lógica)
        └─ Pages (con lógica)
            ↓
            ├─ useQuery (lee de api/*.service.ts)
            ├─ useMutation (escribe con api/*.service.ts)
            └─ Modales (también con mutations)

api/*.service.ts
  ↓
└─ fetch + tipos (types/*.ts)

types/*.ts
  ↓
└─ Interfaces TypeScript (sin dependencias)
```

---

## ✅ Checklist de Codificación Frontend

```
✓ 1. types/*.ts - Definir todos los interfaces
✓ 2. routes/AppRouter.tsx - Rutas con dinámica
✓ 3. api/*.service.ts - Servicios fetch
✓ 4. components/NavBar.tsx - Navbar
✓ 5. pages/CategoriasPage.tsx - Página con useQuery + useMutation
✓ 6. pages/ProductosPage.tsx - Otra página
✓ 7. pages/IngredientesPage.tsx - Otra página
✓ 8. modals/ModalCategories.tsx - Modal de crear/editar
✓ 9. modals/ConfirmDeleteModal.tsx - Modal de confirmación
✓ 10. App.tsx - Providers y ensamblaje
✓ 11. npm run dev - Verificar en http://localhost:5173
✓ 12. Pruebas manuales - CRUD completo funcionando
```

---

## 🎓 Principios de Arquitectura Frontend

1. **Type Safety**: Todo tipado con TypeScript interfaces
2. **Separación de concerns**: Tipos → Servicios → Componentes
3. **State management**: TanStack Query centraliza fetch/cache
4. **Component reusability**: Props tipadas, modales reutilizables
5. **Responsiveness**: Tailwind CSS para mobile-first

