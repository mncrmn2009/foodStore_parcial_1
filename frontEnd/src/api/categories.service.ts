// src/api/categories.service.ts
import type { ICategoria, ICategoriaCreate, ICategoriaList } from "../types/ICategorie";

// Apuntamos a la variable de entorno o por defecto al localhost de FastAPI
const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/categorias`;

export const getCategorias = async (offset = 0, limit = 20): Promise<ICategoriaList> => {
  try {
    const response = await fetch(`${BASE_URL}/?offset=${offset}&limit=${limit}`);
    if (!response.ok) throw new Error("Error al obtener categorías");
    
    // FastAPI devuelve { data: [...], total: X }
    const data: ICategoriaList = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getCategoriaById = async (id: number): Promise<ICategoria> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) throw new Error("Error al obtener la categoría");
    
    const data: ICategoria = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createCategoria = async (
  newCategoria: ICategoriaCreate
): Promise<ICategoria> => {
  try {
    const response = await fetch(`${BASE_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCategoria),
    });
    
    if (!response.ok) throw new Error("Error al crear la categoría");
    
    const data: ICategoria = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateCategoria = async (
  id: number,
  categoria: Partial<ICategoriaCreate>
): Promise<ICategoria> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH", // Tu backend usa PATCH para actualizaciones
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoria),
    });
    
    if (!response.ok) throw new Error("Error al actualizar la categoría");
    
    const data: ICategoria = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteCategoria = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) throw new Error("Error al eliminar la categoría");
    
    // Como FastAPI devuelve 204 No Content en el delete, no hacemos .json()
    return; 
  } catch (error) {
    console.error(error);
    throw error;
  }
};