// src/types/IProduct.ts
import type { ICategoria } from "./ICategorie";
import type { IIngrediente } from "./IIngrediente";

// 1. La forma del Producto cuando lo LEEMOS de la base de datos
export interface IProduct {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen_url?: string | null;
  
  // Relaciones: Cuando hacemos GET, el backend nos devuelve los objetos completos
  categorias: ICategoria[];
  ingredientes: IIngrediente[];
}

// 2. La forma de los datos cuando CREAMOS o EDITAMOS un Producto
export interface IProductCreate {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen_url?: string | null;
  
  // Relaciones: Cuando hacemos POST/PATCH, solo enviamos los arreglos de IDs
  categoria_ids?: number[];
  ingrediente_ids?: number[];
}

// 3. La forma de la respuesta paginada
export interface IProductList {
  data: IProduct[];
  total: number;
}