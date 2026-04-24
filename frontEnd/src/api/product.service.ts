import type { IProduct, IProductCreate, IProductList } from "../types/IProduct";

const BASE_URL = `${import.meta.env.VITE_API_URL}/productos`;

export const getProducts = async (offset = 0, limit = 20): Promise<IProductList> => {
  try {
    const response = await fetch(`${BASE_URL}/?offset=${offset}&limit=${limit}`);
    if (!response.ok) throw new Error("Error al obtener los productos");
    
    const data: IProductList = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getProductsById = async (id: number): Promise<IProduct> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) throw new Error("Error al obtener el producto");
    
    const data: IProduct = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createProduct = async (
  newProduct: IProductCreate
): Promise<IProduct> => {
  try {
    const response = await fetch(`${BASE_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });
    
    if (!response.ok) throw new Error("Error al crear el producto");
    
    const data: IProduct = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateProduct = async (
  id: number,
  product: Partial<IProductCreate>
): Promise<IProduct> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH", // Usamos PATCH según la configuración de tu backend
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    
    if (!response.ok) throw new Error("Error al actualizar el producto");
    
    const data: IProduct = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteProduct = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) throw new Error("Error al eliminar el producto");
    
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
};