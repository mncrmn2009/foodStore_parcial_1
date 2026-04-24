export interface IIngrediente {
  id: number;
  nombre: string;
}

export interface IIngredienteCreate {
  nombre: string;
}

export interface IIngredienteList {
  data: IIngrediente[];
  total: number;
}