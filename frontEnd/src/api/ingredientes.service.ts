import type { IIngrediente, IIngredienteCreate, IIngredienteList } from "../types/IIngrediente";

const BASE_URL = `${import.meta.env.VITE_API_URL}/ingredientes`;

export const getIngredientes = async (offset = 0, limit = 20): Promise<IIngredienteList> => {
  try {
    const response = await fetch(`${BASE_URL}/?offset=${offset}&limit=${limit}`);
    if (!response.ok) throw new Error("Error al obtener los ingredientes");
    
    const data: IIngredienteList = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getIngredienteById = async (id: number): Promise<IIngrediente> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) throw new Error("Error al obtener el ingrediente");
    
    const data: IIngrediente = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createIngrediente = async (
  newIngrediente: IIngredienteCreate
): Promise<IIngrediente> => {
  try {
    const response = await fetch(`${BASE_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIngrediente),
    });
    
    if (!response.ok) throw new Error("Error al crear el ingrediente");
    
    const data: IIngrediente = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateIngrediente = async (
  id: number,
  ingrediente: Partial<IIngredienteCreate>
): Promise<IIngrediente> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ingrediente),
    });
    
    if (!response.ok) throw new Error("Error al actualizar el ingrediente");
    
    const data: IIngrediente = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteIngrediente = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) throw new Error("Error al eliminar el ingrediente");
    
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
};