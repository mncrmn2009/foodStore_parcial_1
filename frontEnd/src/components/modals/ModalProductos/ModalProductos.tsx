// src/components/modals/ModalProductos/ModalProductos.tsx
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct, updateProduct } from "../../../api/product.service";
import { getCategorias } from "../../../api/categories.service";
import { getIngredientes } from "../../../api/ingredientes.service";
import { useForm } from "../../../hooks/useForm";
import { useNotification } from "../../../hooks/useNotification";
import { Notification } from "../../ui/Notification";
import type { IProduct, IProductCreate } from "../../../types/IProduct";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  productoToEdit?: IProduct | null;
}

export const ModalProductos = ({ isOpen, onClose, productoToEdit }: ModalProps) => {
  const queryClient = useQueryClient();
  const { mensajeExito, mensajeError, mostrarExito, mostrarError } = useNotification();

  const { data: categoriasData } = useQuery({
    queryKey: ["categorias"],
    queryFn: () => getCategorias(0, 100),
    enabled: isOpen,
  });

  const { data: ingredientesData } = useQuery({
    queryKey: ["ingredientes"],
    queryFn: () => getIngredientes(0, 100),
    enabled: isOpen,
  });

  const { formState, handleChange, setFormState } = useForm<IProductCreate>({
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    categoria_ids: [],
    ingrediente_ids: [],
  });

  useEffect(() => {
    if (productoToEdit) {
      setFormState({
        nombre: productoToEdit.nombre,
        descripcion: productoToEdit.descripcion || "",
        precio: productoToEdit.precio,
        stock: productoToEdit.stock,
        categoria_ids: productoToEdit.categorias?.map(c => c.id),
        ingrediente_ids: productoToEdit.ingredientes?.map(i => i.id),
      });
    } else {
      setFormState({
        nombre: "",
        descripcion: "",
        precio: 0,
        stock: 0,
        categoria_ids: [],
        ingrediente_ids: [],
      });
    }
  }, [productoToEdit, setFormState, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: IProductCreate) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      mostrarExito("Producto creado correctamente");
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: () => {
      mostrarError("Error al crear el producto");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: IProductCreate) => updateProduct(productoToEdit!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      mostrarExito("Producto actualizado correctamente");
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: () => {
      mostrarError("Error al actualizar el producto");
    },
  });

  const handleCheckboxArray = (id: number, field: 'categoria_ids' | 'ingrediente_ids') => {
    setFormState(prev => {
      const currentArray = prev[field] || [];
      if (currentArray.includes(id)) {
        return { ...prev, [field]: currentArray.filter(itemId => itemId !== id) };
      } else {
        return { ...prev, [field]: [...currentArray, id] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productoToEdit) {
      updateMutation.mutate(formState);
    } else {
      createMutation.mutate(formState);
    }
  };

  if (!isOpen) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {productoToEdit ? "Editar Producto" : "Añadir Producto"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formState.nombre || ""}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                <input
                  type="number"
                  name="precio"
                  value={formState.precio === 0 ? "" : formState.precio}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock (Cantidad disponible)</label>
                <input
                  type="number"
                  name="stock"
                  value={formState.stock === 0 ? "" : formState.stock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={formState.descripcion || ""}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-2 gap-6">
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-48 overflow-y-auto">
                <label className="block text-sm font-bold text-gray-700 mb-3 sticky top-0 bg-gray-50 pb-2">
                  Seleccionar Categorías
                </label>
                <div className="space-y-2">
                  {categoriasData?.data?.map(cat => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-gray-100 rounded">
                      <input
                        type="checkbox"
                        checked={formState.categoria_ids?.includes(cat.id)}
                        onChange={() => handleCheckboxArray(cat.id, 'categoria_ids')}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-48 overflow-y-auto">
                <label className="block text-sm font-bold text-gray-700 mb-3 sticky top-0 bg-gray-50 pb-2">
                  Seleccionar Ingredientes
                </label>
                <div className="space-y-2">
                  {ingredientesData?.data?.map(ing => (
                    <label key={ing.id} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-gray-100 rounded">
                      <input
                        type="checkbox"
                        checked={formState.ingrediente_ids?.includes(ing.id)}
                        onChange={() => handleCheckboxArray(ing.id, 'ingrediente_ids')}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{ing.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
          <button type="submit" form="productForm" disabled={isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
            {isPending ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>

      </div>
      <Notification mensajeExito={mensajeExito} mensajeError={mensajeError} />
    </div>
  );
};
