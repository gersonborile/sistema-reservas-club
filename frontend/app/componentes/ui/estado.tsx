import type { ReactNode } from "react";

import { Icono } from "@/app/componentes/ui/iconos";
import type { NombreIcono } from "@/app/componentes/ui/iconos";

export function IlustracionVacia({
  icono = "calendario",
}: {
  icono?: NombreIcono;
}) {
  return (
    <div className="relative mx-auto flex h-28 w-40 items-center justify-center">
      <svg
        viewBox="0 0 160 112"
        className="absolute inset-0 h-full w-full text-outline-variant"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <rect x="8" y="16" width="144" height="88" rx="4" />
        <path d="M80 16v88" />
        <circle cx="80" cy="60" r="20" />
        <path d="M8 38h22v44H8M152 38h-22v44h22" />
      </svg>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-lowest text-secondary shadow-sm">
        <Icono nombre={icono} className="h-7 w-7" />
      </span>
    </div>
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
      className="rounded-3xl border border-dashed border-outline-variant/60 bg-surface-container-lowest px-6 py-10 text-center"
    >
      <IlustracionVacia icono={icono} />
      <h2 className="mt-4 text-lg font-bold tracking-tight text-on-surface">
        {titulo}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
        {descripcion}
      </p>
      {accion ? <div className="mt-5">{accion}</div> : null}
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
      className="rounded-3xl border border-danger/20 bg-danger-container px-6 py-8 text-center"
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-danger/15 bg-white/60 text-danger">
        <Icono nombre="advertencia" className="h-6 w-6" />
      </span>
      <p className="mx-auto mt-4 max-w-lg text-sm font-medium leading-relaxed text-on-danger-container">
        {mensaje}
      </p>
      <button
        type="button"
        onClick={onReintentar}
        className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
      >
        {etiqueta}
      </button>
    </div>
  );
}
