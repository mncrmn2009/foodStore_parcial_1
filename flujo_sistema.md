# Documentación Técnica del Flujo del Sistema

## Frontend (Vite + React + TanStack Query)

### 1. Estructura del Proyecto
El frontend está organizado en carpetas como `src/components`, `src/pages`, `src/api`, y `src/hooks`. El punto de entrada es `main.tsx`, donde se configura el proveedor de React Query:

```tsx
// src/main.tsx
const queryClient = new QueryClient();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

### 2. Flujo de Renderizado en React
El componente principal es `App.tsx`, que define el enrutamiento usando React Router:

```tsx
// src/App.tsx
<BrowserRouter>
  <AppRouter />
</BrowserRouter>
```

`AppRouter` define las rutas principales y renderiza el `NavBar` y las páginas:

```tsx
// src/routes/AppRouter.tsx
<Routes>
  <Route path="/productos" element={<ProductosPage />} />
  <Route path="/products/:id" element={<ProductDetailPage />} />
</Routes>
```

### 3. Manejo de Estado
Se usan hooks personalizados como `useForm` para formularios:

```tsx
// src/hooks/useForm.ts
const [formState, setFormState] = useState(initialState);
const handleChange = (e) => { setFormState({ ...formState, [e.target.name]: e.target.value }); };
```

### 4. Uso de TanStack Query
Las queries y mutations gestionan el estado remoto y el caché:

```tsx
// src/pages/ProductosPage.tsx
const { data: productosData } = useQuery({
  queryKey: ["productos", page],
  queryFn: () => getProducts(page * LIMIT, LIMIT),
});

const deleteMutation = useMutation({
  mutationFn: (id) => deleteProduct(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
});
```

### 5. Comunicación entre Componentes
Los componentes se comunican vía props y hooks. Ejemplo: `ProductosPage` abre modales y pasa datos a componentes hijos.

### 6. Llamadas al Backend
Las llamadas HTTP se centralizan en servicios:

```ts
// src/api/product.service.ts
export const getProducts = async (offset = 0, limit = 20) => {
  const response = await fetch(`${BASE_URL}/?offset=${offset}&limit=${limit}`);
  return response.json();
};
```

---

## Backend (FastAPI)

### 1. Estructura del Proyecto
El backend sigue una estructura modular: `app/modules/productos`, `app/core/database.py`, etc. El punto de entrada es `main.py`.

### 2. Definición de Rutas/Endpoints
Las rutas se definen en routers:

```py
# app/modules/productos/router.py
@router.post("/", response_model=ProductoPublic)
def create_producto(data: ProductoCreate, svc: ProductoService = Depends(get_producto_service)):
    return svc.create(data)
```

### 3. Flujo de una Request
1. El usuario hace una petición HTTP.
2. FastAPI enruta la petición al endpoint.
3. Se valida el body con Pydantic (schemas).
4. Se ejecuta la lógica de negocio en el service.
5. Se accede a la base de datos vía SQLModel.
6. Se retorna la respuesta serializada.

### 4. Validaciones (Pydantic, Schemas)

```py
# app/modules/productos/schemas.py
class ProductoCreate(SQLModel):
    nombre: str
    precio: float
    categoria_ids: List[int]
```

### 5. Lógica de Negocio

```py
# app/modules/productos/service.py
class ProductoService:
    def create(self, data: ProductoCreate):
        # Validaciones y creación en DB
```

### 6. Conexión con Base de Datos (PostgreSQL)

```py
# app/core/database.py
engine = create_engine(settings.DATABASE_URL)
def get_session():
    with Session(engine) as session:
        yield session
```

---

## Flujo Completo (Frontend → Backend)
1. El usuario interactúa con la UI (ej: crea producto).
2. Se dispara una mutation/query de React Query que llama a un servicio (`fetch`).
3. El backend recibe la request, valida, ejecuta lógica y responde.
4. El frontend actualiza el estado/caché y refleja el cambio en la UI.

---

## Conclusión
El sistema está claramente separado en frontend (React + TanStack Query) y backend (FastAPI), comunicándose vía HTTP. El frontend gestiona el estado local y remoto, mientras el backend valida, procesa y persiste los datos. Esta arquitectura facilita el mantenimiento y escalabilidad.
