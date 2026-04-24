import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, deleteProduct } from "../api/product.service";
import type { IProduct } from "../types/IProduct";
import { ModalProductos } from "../components/modals/ModalProductos/ModalProductos";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";

export const ProductosPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const LIMIT = 5;
  
  const [mensajeExito, setMensajeExito] = useState<string | null> (null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productoToEdit, setProductoToEdit] = useState<IProduct | undefined>(undefined);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [productIdToDelete, setProductIdToDelete] = useState<number | null>(null);

  const { data: productosData, isLoading, isError } = useQuery({
    queryKey: ["productos", page],
    queryFn: () => getProducts(page * LIMIT, LIMIT),
  });

  const totalItems = productosData?.total || 0;
  const totalPages = Math.ceil(totalItems / LIMIT);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });

      setMensajeExito("Producto eliminado correctamente");

      setTimeout(()=> {
        setMensajeExito(null);
      }, 3000);
    },
  });

  const handleOpenModal = (producto?: IProduct) => {
    setProductoToEdit(producto);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductoToEdit(undefined);
  };

  const handleDelete = (id: number) => {
    setProductIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productIdToDelete !== null) {
      deleteMutation.mutate(productIdToDelete);
      setIsDeleteConfirmOpen(false);
      setProductIdToDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona el catálogo de tu tienda</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          + Añadir Producto
        </button>
      </div>

      {isLoading && <div className="text-center py-10 text-gray-500">Cargando productos...</div>}
      {isError && <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">Error al cargar los datos.</div>}

      {productosData && productosData.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productosData.data.map((prod) => (
                <tr key={prod.id} className="hover:bg-indigo-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-500">#{prod.id}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{prod.nombre}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">${prod.precio}</td>
                  <td className="py-3 px-4 text-sm font-bold text-gray-700">{prod.stock} u.</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${prod.stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {prod.stock > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    <button
                      onClick={() => navigate(`/products/${prod.id}`)}
                      className="text-green-600 hover:text-green-800 font-medium mr-4 transition-colors"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleOpenModal(prod)}
                      className="text-blue-600 hover:text-blue-800 font-medium mr-4 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
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
          <span className="ml-2 text-gray-400">({totalItems} productos en total)</span>
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

      {productosData && productosData.data.length === 0 && (
        <div className="text-center py-10 text-gray-500">No hay productos registrados.</div>
      )}

      
      <ModalProductos 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        productoToEdit={productoToEdit} 
      />

      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Eliminar producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setProductIdToDelete(null);
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