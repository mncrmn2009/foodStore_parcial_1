import type { ICategoria } from "./ICategorie";
import type { IIngrediente } from "./IIngrediente";

export interface IProduct {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen_url?: string | null;
  
  // Relaciones
  categorias: ICategoria[];
  ingredientes: IIngrediente[];
}


export interface IProductCreate {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen_url?: string | null;
  
  categoria_ids?: number[];
  ingrediente_ids?: number[];
}

export interface IProductList {
  data: IProduct[];
  total: number;
}