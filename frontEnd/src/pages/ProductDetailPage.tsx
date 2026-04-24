import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProductsById } from "../api/product.service";

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["producto", id],
    queryFn: () => getProductsById(Number(id)), 
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-10 text-center text-gray-500">
        Cargando detalles del producto...
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-10 text-center">
        <h1 className="text-xl font-bold text-gray-800">No existe el producto</h1>
        <button 
          onClick={() => navigate("/products")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Volver a productos
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/products")}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Volver"
        >
          ← Volver
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{product.nombre}</h1>
      </div>

      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-6 flex flex-col gap-6">
        
        
        <div className="flex flex-col gap-3">
          {product.categorias && product.categorias.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-2">
                Categorías:
              </span>
              {product.categorias.map(cat => (
                <span
                  key={cat.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                >
                  {cat.nombre}
                </span>
              ))}
            </div>
          )}

          
          {product.ingredientes && product.ingredientes.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-2">
                Ingredientes:
              </span>
              {product.ingredientes.map(ing => (
                <span
                  key={ing.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                >
                  {ing.nombre}
                </span>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Descripción
          </span>
          <p className="text-sm text-gray-700 leading-relaxed">
            {product.descripcion || "Este producto no tiene una descripción detallada."}
          </p>
        </div>

        
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Precio
            </span>
            <span className="text-2xl font-bold text-gray-900">
              ${product.precio.toLocaleString("es-AR")}
            </span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Estado
            </span>
            <span
              className={`inline-flex items-center w-fit px-3 py-1 rounded-full text-sm font-semibold ${
                product.stock
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {product.stock ? "Disponible para venta" : "Agotado temporalmente"}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};