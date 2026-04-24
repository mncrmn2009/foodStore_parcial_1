import type { ICategoria, ICategoriaCreate, ICategoriaList } from "../types/ICategorie";

const BASE_URL = `${import.meta.env.VITE_API_URL}/categorias`;

export const getCategorias = async (offset = 0, limit = 20): Promise<ICategoriaList> => {
  try {
    const response = await fetch(`${BASE_URL}/?offset=${offset}&limit=${limit}`);
    if (!response.ok) throw new Error("Error al obtener categorías");
    
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
      method: "PATCH",
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
    
    return; 
  } catch (error) {
    console.error(error);
    throw error;
  }
};