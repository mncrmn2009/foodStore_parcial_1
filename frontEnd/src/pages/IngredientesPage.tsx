import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIngredientes, deleteIngrediente } from "../api/ingredientes.service";
import type { IIngrediente } from "../types/IIngrediente";
import { ModalIngredientes } from "../components/modals/ModalIngredientes/ModalIngredientes";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";

export const IngredientesPage = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [ingredienteToEdit, setIngredienteToEdit] = useState<IIngrediente | undefined>(undefined);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [ingredienteIdToDelete, setIngredienteIdToDelete] = useState<number | null>(null);

  const { data: ingredientesData, isLoading, isError } = useQuery({
    queryKey: ["ingredientes", page],
    queryFn: () => getIngredientes(page * LIMIT, LIMIT),
  });

  const totalItems = ingredientesData?.total || 0;
  const totalPages = Math.ceil(totalItems / LIMIT);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteIngrediente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredientes"] });

      setMensajeExito("Ingrediente eliminado correctamente");

      setTimeout(() => {
        setMensajeExito(null);
      }, 3000);
    },
  });

  const handleOpenModal = (ingrediente?: IIngrediente) => {
    setIngredienteToEdit(ingrediente);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIngredienteToEdit(undefined);
  };

  const handleDelete = (id: number) => {
    setIngredienteIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ingredienteIdToDelete !== null) {
      deleteMutation.mutate(ingredienteIdToDelete);
      setIsDeleteConfirmOpen(false);
      setIngredienteIdToDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingredientes</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los ingredientes de tus productos</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          + Añadir Ingrediente
        </button>
      </div>

      {isLoading && <div className="text-center py-10 text-gray-500">Cargando ingredientes...</div>}
      {isError && <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">Error al cargar los datos.</div>}

      {ingredientesData && ingredientesData.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ingredientesData.data.map((ing) => (
                <tr key={ing.id} className="hover:bg-green-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-500">#{ing.id}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{ing.nombre}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <button
                      onClick={() => handleOpenModal(ing)}
                      className="text-blue-600 hover:text-blue-800 font-medium mr-4 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(ing.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? "Borrando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-600">
              Página <strong>{page + 1}</strong> de <strong>{totalPages || 1}</strong>
              <span className="ml-2 text-gray-400">({totalItems} ingredientes en total)</span>
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => setPage((old) => Math.max(old - 1, 0))}
                disabled={page === 0 || isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => {
                  if (page + 1 < totalPages) {
                    setPage((old) => old + 1);
                  }
                }}
                disabled={page + 1 >= totalPages || isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>

        </div>
      )}

      {ingredientesData && ingredientesData.data.length === 0 && (
        <div className="text-center py-10 text-gray-500">No hay ingredientes registrados.</div>
      )}

      <ModalIngredientes 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        ingredienteToEdit={ingredienteToEdit} 
      />

      <ConfirmDeleteModal 
        isOpen={isDeleteConfirmOpen}
        title="Eliminar Ingrediente"
        message="¿Estás seguro de que deseas eliminar este ingrediente? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};