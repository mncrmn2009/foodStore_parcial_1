import { Routes, Route, Navigate } from 'react-router-dom';
import { CategoriasPage } from '../pages/CategoriasPage';
import { ProductosPage } from '../pages/ProductosPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { IngredientesPage } from '../pages/IngredientesPage';
import { NavBar } from "../components/NavBar/NavBar";

export const AppRouter = () => {
  return (
    <>
        <NavBar />
        <main>
            <Routes>
                <Route path="/" element={<Navigate to="/categorias" />} />
                <Route path="/categorias" element={<CategoriasPage />} />
                <Route path="/productos" element={<ProductosPage />} />
                <Route path="/products" element={<ProductosPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/ingredientes" element={<IngredientesPage />} />

                <Route path="*" element={<div>404 - Página no encontrada</div>} /> 
            </Routes>
        </main>
    </>
  );
};