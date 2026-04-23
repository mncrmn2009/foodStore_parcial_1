import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategorias, deleteCategoria } from "../api/categories.service";
import type { ICategoria } from "../types/ICategorie";
import { ModalCategories } from "../components/modals/ModalCategories/ModalCategories";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";

export const CategoriasPage = () => {
  // 1. Instancia del cliente para invalidar la caché
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const LIMIT = 5;

  // 2. Estados locales para el Modal (Tipados con TS)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState<ICategoria | undefined>(undefined);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [categoriaIdToDelete, setCategoriaIdToDelete] = useState<number | null>(null);

  // 3. TanStack Query: LECTURA (useQuery) directamente en la página
  const { data: categoriasData, isLoading, isError } = useQuery({
    queryKey: ["categorias", page],
    queryFn: () => getCategorias(page * LIMIT, LIMIT),
  });

  const totalItems = categoriasData?.total || 0;
  const totalPages = Math.ceil(totalItems / LIMIT);

  // 4. TanStack Query: MUTACIÓN para Borrar con invalidación de caché
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: () => {
      // ¡Acá está la invalidación que pide el parcial!
      queryClient.invalidateQueries({ queryKey: ["categorias"] });

      setMensajeExito("Categoría eliminada correctamente");

      setTimeout(() => {
        setMensajeExito(null);
      }, 3000);
    },
  });

  // Funciones para manejar la UI
  const handleOpenModal = (categoria?: ICategoria) => {
    setCategoriaToEdit(categoria);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoriaToEdit(undefined);
  };

  const handleDelete = (id: number) => {
    setCategoriaIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoriaIdToDelete !== null) {
      deleteMutation.mutate(categoriaIdToDelete);
      setIsDeleteConfirmOpen(false);
      setCategoriaIdToDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona las categorías de tu menú</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          + Añadir Categoría
        </button>
      </div>

      {/* Manejo de estados de carga y error */}
      {isLoading && (
        <div className="text-center py-10 text-gray-500">Cargando categorías...</div>
      )}
      
      {isError && (
        <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">
          Ocurrió un error al cargar los datos.
        </div>
      )}

      {/* Tabla de Datos */}
      {categoriasData && categoriasData.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categoriasData.data.map((cat) => (
                <tr key={cat.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-500">#{cat.id}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{cat.nombre}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{cat.descripcion || "-"}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="text-blue-600 hover:text-blue-800 font-medium mr-4 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
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

          {/* --- CONTROLES DE PAGINACIÓN --- */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-600">
              Página <strong>{page + 1}</strong> de <strong>{totalPages || 1}</strong>
              <span className="ml-2 text-gray-400">({totalItems} categorías en total)</span>
            </span>
            
            <div className="flex gap-2">
              {/* Botón Anterior */}
              <button
                onClick={() => setPage((old) => Math.max(old - 1, 0))}
                disabled={page === 0 || isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              
              {/* Botón Siguiente */}
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

      {categoriasData && categoriasData.data.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No hay categorías registradas. ¡Crea la primera!
        </div>
      )}

      {/* AQUÍ IRÁ EL MODAL: Lo comentamos por ahora para que no te dé error */}
      <ModalCategories 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        categoriaToEdit={categoriaToEdit} 
      />

      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Eliminar categoría"
        message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setCategoriaIdToDelete(null);
        }}
        isLoading={deleteMutation.isPending}
      />

      {mensajeExito && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-bounce">
          {mensajeExito}
        </div>
      )}
      
    </div>
  );
};