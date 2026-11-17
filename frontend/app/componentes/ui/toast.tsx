"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Icono } from "@/app/componentes/ui/iconos";

export type TonoToast = "exito" | "error" | "info";

type Toast = {
  id: number;
  mensaje: string;
  tono: TonoToast;
};

type ContextoToast = {
  mostrarToast: (mensaje: string, tono?: TonoToast) => void;
};

const Contexto = createContext<ContextoToast | null>(null);

let siguienteId = 0;

const ESTILOS: Record<TonoToast, string> = {
  exito: "border-secondary/25 bg-white text-on-surface",
  error: "border-danger/25 bg-danger-container text-on-danger-container",
  info: "border-outline-variant/50 bg-white text-on-surface",
};

const ICONOS: Record<TonoToast, "check" | "advertencia" | "informacion"> = {
  exito: "check",
  error: "advertencia",
  info: "informacion",
};

export function ProveedorToasts({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const temporizadores = useRef<number[]>([]);

  const cerrar = useCallback((id: number) => {
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id));
  }, []);

  const mostrarToast = useCallback(
    (mensaje: string, tono: TonoToast = "info") => {
      const id = (siguienteId += 1);
      setToasts((actuales) => [...actuales.slice(-2), { id, mensaje, tono }]);
      const temporizador = window.setTimeout(() => cerrar(id), 5200);
      temporizadores.current.push(temporizador);
    },
    [cerrar],
  );

  useEffect(() => {
    return () => {
      for (const temporizador of temporizadores.current) {
        window.clearTimeout(temporizador);
      }
    };
  }, []);

  return (
    <Contexto.Provider value={{ mostrarToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tono === "error" ? "alert" : "status"}
            className={`toast-entrada pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg shadow-primary/10 ${ESTILOS[toast.tono]}`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                toast.tono === "error"
                  ? "bg-danger/10 text-danger"
                  : "bg-secondary-soft text-secondary"
              }`}
            >
              <Icono nombre={ICONOS[toast.tono]} className="h-4 w-4" />
            </span>
            <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed">
              {toast.mensaje}
            </p>
            <button
              type="button"
              onClick={() => cerrar(toast.id)}
              aria-label="Cerrar aviso"
              className="rounded-full p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
            >
              <Icono nombre="cerrar" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useToast(): ContextoToast {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useToast debe usarse dentro de ProveedorToasts.");
  }
  return contexto;
}
