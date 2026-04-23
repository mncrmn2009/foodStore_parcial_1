// src/types/ICategorie.ts

// 1. La forma de una Categoría cuando viene de la Base de Datos
export interface ICategoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  parent_id?: number | null;
  created_at: string;
  updated_at: string;
}

// 2. La forma de los datos cuando queremos CREAR o EDITAR una categoría
export interface ICategoriaCreate {
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  parent_id?: number | null;
}

// 3. La forma de la respuesta cuando pedimos la lista completa (Paginación)
export interface ICategoriaList {
  data: ICategoria[];
  total: number;
}