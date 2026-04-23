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
        <main>
            <Routes>
            {/* Ruta por defecto que redirige a categorías  */}
                <Route path="/" element={<Navigate to="/categorias" />} />
      
                <Route path="/categorias" element={<CategoriasPage />} />
                <Route path="/productos" element={<ProductosPage />} />
                <Route path="/products" element={<ProductosPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/ingredientes" element={<IngredientesPage />} />
      
            {/* Opcional: Ruta para manejar errores 404 */}
                <Route path="*" element={<div>404 - Página no encontrada</div>} /> 
            </Routes>
        </main>
    </>
  );
};