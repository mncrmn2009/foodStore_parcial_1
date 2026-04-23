// src/hooks/useNotification.ts
import { useState } from "react";

export const useNotification = (tiempoVisible: number = 3000) => {
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const mostrarExito = (mensaje: string) => {
    setMensajeError(null); // Limpiamos errores previos
    setMensajeExito(mensaje);
    setTimeout(() => {
      setMensajeExito(null);
    }, tiempoVisible);
  };

  const mostrarError = (mensaje: string) => {
    setMensajeExito(null); // Limpiamos éxitos previos
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