import type { ReactNode } from "react";

import { Icono } from "@/app/componentes/ui/iconos";
import type { NombreIcono } from "@/app/componentes/ui/iconos";

export function IlustracionVacia({
  icono = "calendario",
}: {
  icono?: NombreIcono;
}) {
  return (
    <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-secondary/15 bg-secondary-soft text-secondary">
      <span
        aria-hidden="true"
        className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-surface-container-lowest bg-secondary-container"
      />
      <Icono nombre={icono} className="h-5 w-5" />
    </span>
  );
}

export function EstadoVacio({
  titulo,
  descripcion,
  accion,
  icono = "calendario",
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
  icono?: NombreIcono;
}) {
  return (
    <div
      role="status"
      className="relative overflow-hidden rounded-3xl border border-outline-variant/55 bg-surface-container-lowest px-5 py-6 sm:px-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full border border-secondary/10"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <IlustracionVacia icono={icono} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-3xl leading-[1.05] text-primary">
            {titulo}
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-on-surface-variant">
            {descripcion}
          </p>
        </div>
        {accion ? <div className="flex-shrink-0">{accion}</div> : null}
      </div>
    </div>
  );
}

export function EstadoError({
  mensaje,
  onReintentar,
  etiqueta = "Reintentar",
}: {
  mensaje: string;
  onReintentar: () => void;
  etiqueta?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-3xl border border-danger/20 bg-danger-container px-5 py-5 sm:flex-row sm:items-center sm:px-6"
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-danger/15 bg-white/70 text-danger">
        <Icono nombre="advertencia" className="h-5 w-5" />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-on-danger-container">
        {mensaje}
      </p>
      <button
        type="button"
        onClick={onReintentar}
        className="w-fit flex-shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-soft"
      >
        {etiqueta}
      </button>
    </div>
  );
}
