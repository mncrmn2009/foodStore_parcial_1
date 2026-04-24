import { useState } from "react";

export const useNotification = (tiempoVisible: number = 3000) => {
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const mostrarExito = (mensaje: string) => {
    setMensajeError(null);
    setMensajeExito(mensaje);
    setTimeout(() => {
      setMensajeExito(null);
    }, tiempoVisible);
  };

  const mostrarError = (mensaje: string) => {
    setMensajeExito(null);
    setMensajeError(mensaje);
    setTimeout(() => {
      setMensajeError(null);
    }, tiempoVisible);
  };

  return {
    mensajeExito,
    mensajeError,
    mostrarExito,
    mostrarError,
  };
};