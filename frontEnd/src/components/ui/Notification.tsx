// src/components/ui/Notification.tsx

interface NotificationProps {
  mensajeExito: string | null;
  mensajeError: string | null;
}

export const Notification = ({ mensajeExito, mensajeError }: NotificationProps) => {
  if (!mensajeExito && !mensajeError) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {/* Cartel Verde de Éxito */}
      {mensajeExito && (
        <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-bounce">
          ✓ {mensajeExito}
        </div>
      )}

      {/* Cartel Rojo de Error */}
      {mensajeError && (
        <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-bounce">
          ⚠ {mensajeError}
        </div>
      )}
    </div>
  );
};