// src/components/modals/ModalCategories/ModalCategories.tsx
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategoria, updateCategoria } from "../../../api/categories.service";
import { useForm } from "../../../hooks/useForm";
import { useNotification } from "../../../hooks/useNotification";
import { Notification } from "../../ui/Notification";
import type { ICategoria, ICategoriaCreate } from "../../../types/ICategorie";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriaToEdit?: ICategoria | null;
}

export const ModalCategories = ({ isOpen, onClose, categoriaToEdit }: ModalProps) => {
  const queryClient = useQueryClient();
  const { mensajeExito, mensajeError, mostrarExito, mostrarError } = useNotification();

  // 1. Usamos tu custom hook
  const { formState, handleChange, setFormState } = useForm<ICategoriaCreate>({
    nombre: "",
    descripcion: "",
  });


  // 2. Efecto para rellenar el formulario si estamos editando [cite: 359]
  useEffect(() => {
    if (categoriaToEdit) {
      setFormState({
        nombre: categoriaToEdit.nombre,
        descripcion: categoriaToEdit.descripcion || "",
      });
    } else {
      // Limpiamos si es una nueva categoría
      setFormState({ nombre: "", descripcion: "" });
    }
  }, [categoriaToEdit, setFormState, isOpen]);

  // 3. Mutación para CREAR
  const createMutation = useMutation({
    mutationFn: (data: ICategoriaCreate) => createCategoria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] }); // Invalidar caché 
      mostrarExito("Categoría creada correctamente");
      setTimeout(() => {
        onClose(); // Cerramos el modal al terminar 
      }, 500);
    },
    onError: () => {
      mostrarError("Error al crear la categoría");
    },
  });

  // 4. Mutación para ACTUALIZAR
  const updateMutation = useMutation({
    mutationFn: (data: ICategoriaCreate) => updateCategoria(categoriaToEdit!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] }); // Invalidar caché 
      mostrarExito("Categoría actualizada correctamente");
      setTimeout(() => {
        onClose(); // Cerramos el modal al terminar
      }, 500);
    },
    onError: () => {
      mostrarError("Error al actualizar la categoría");
    },
  });

  // Manejador del envío del formulario [cite: 357]
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoriaToEdit) {
      updateMutation.mutate(formState);
    } else {
      createMutation.mutate(formState);
    }
  };

  // Si el modal no está abierto, no renderizamos nada [cite: 357]
  if (!isOpen) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {categoriaToEdit ? "Editar Categoría" : "Añadir Categoría"} [cite: 372, 373, 395]
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">
            &times;
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la categoría [cite: 398]
              </label>
              <input
                type="text"
                name="nombre"
                value={formState.nombre}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Ej. Pizzas, Bebidas..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción [cite: 404]
              </label>
              <textarea
                name="descripcion"
                value={formState.descripcion || ""}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Descripción de la categoría..."
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancelar [cite: 409]
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar"} [cite: 410]
            </button>
          </div>
        </form>
      </div>
      <Notification mensajeExito={mensajeExito} mensajeError={mensajeError} />
    </div>
  );
};