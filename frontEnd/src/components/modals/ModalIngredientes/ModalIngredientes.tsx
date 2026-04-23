import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createIngrediente, updateIngrediente } from "../../../api/ingredientes.service";
import { useForm } from "../../../hooks/useForm";
import { useNotification } from "../../../hooks/useNotification";
import { Notification } from "../../ui/Notification";
import type { IIngrediente, IIngredienteCreate } from "../../../types/IIngrediente";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredienteToEdit?: IIngrediente | null;
}

export const ModalIngredientes = ({ isOpen, onClose, ingredienteToEdit }: ModalProps) => {
  const queryClient = useQueryClient();
  const { mensajeExito, mensajeError, mostrarExito, mostrarError } = useNotification();

  const { formState, handleChange, setFormState } = useForm<IIngredienteCreate>({
    nombre: "",
  });

  useEffect(() => {
    if (ingredienteToEdit) {
      setFormState({ nombre: ingredienteToEdit.nombre });
    } else {
      setFormState({ nombre: "" });
    }
  }, [ingredienteToEdit, setFormState, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: IIngredienteCreate) => createIngrediente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredientes"] });
      mostrarExito("Ingrediente creado correctamente");
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: () => {
      mostrarError("Error al crear el ingrediente");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: IIngredienteCreate) => updateIngrediente(ingredienteToEdit!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredientes"] });
      mostrarExito("Ingrediente actualizado correctamente");
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: () => {
      mostrarError("Error al actualizar el ingrediente");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredienteToEdit) {
      updateMutation.mutate(formState);
    } else {
      createMutation.mutate(formState);
    }
  };

  if (!isOpen) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {ingredienteToEdit ? "Editar Ingrediente" : "Añadir Ingrediente"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del ingrediente</label>
              <input
                type="text"
                name="nombre"
                value={formState.nombre}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="Ej. Queso, Tomate..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
      <Notification mensajeExito={mensajeExito} mensajeError={mensajeError} />
    </div>
  );
};