import type { ReactNode, SVGProps } from "react";

import { normalizarDisciplina } from "@/lib/imagenes";

export type NombreIcono =
  | "calendario"
  | "equipamiento"
  | "check"
  | "flecha"
  | "reloj"
  | "usuarios"
  | "ubicacion"
  | "cancha"
  | "advertencia"
  | "buscar"
  | "menu"
  | "cerrar"
  | "informacion"
  | "home"
  | "ticket"
  | "salir"
  | "chevron"
  | "rayo"
  | "tenis"
  | "futbol"
  | "padel"
  | "generico";

const TRAZOS: Record<NombreIcono, ReactNode> = {
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </>
  ),
  equipamiento: (
    <>
      <ellipse cx="9.5" cy="9.5" rx="5" ry="7" transform="rotate(-38 9.5 9.5)" />
      <path d="m13.2 14.1 5.4 5.4" />
      <path d="m16.1 17 2.1-2.1" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  flecha: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  usuarios: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M21 20c0-2.5-1.7-4.6-4-5.3" />
    </>
  ),
  ubicacion: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  cancha: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 9h3v6H3M21 9h-3v6h3" />
    </>
  ),
  advertencia: (
    <>
      <path d="M10.3 4.2 2.8 18a1.8 1.8 0 0 0 1.6 2.7h15.2a1.8 1.8 0 0 0 1.6-2.7L13.7 4.2a1.8 1.8 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  cerrar: <path d="m6 6 12 12M18 6 6 18" />,
  informacion: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 7h16v3.2a2 2 0 0 0 0 3.6V17H4v-3.2a2 2 0 0 0 0-3.6V7Z" />
      <path d="M14 7v10" strokeDasharray="2 2.5" />
    </>
  ),
  salir: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="m9 8-4 4 4 4" />
      <path d="M5 12h10" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  rayo: <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />,
  tenis: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.2 6.8c2.9 1.5 4.7 4.4 4.7 7.7 0 2.2-.8 4.2-2.2 5.7" />
      <path d="M18.8 17.2c-2.9-1.5-4.7-4.4-4.7-7.7 0-2.2.8-4.2 2.2-5.7" />
    </>
  ),
  futbol: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 4 2.9-1.5 4.6h-5L8 9.9 12 7Z" />
      <path d="M12 3v4M4.2 9.3 8 9.9M19.8 9.3 16 9.9M6.6 19.5l2.9-5M17.4 19.5l-2.9-5" />
    </>
  ),
  padel: (
    <>
      <path d="M14.7 3.3a6 6 0 0 1 0 8.5l-.9.9-7.6 7.6a2.1 2.1 0 0 1-3-3l7.6-7.6.9-.9a6 6 0 0 1 8.5 0Z" />
      <path d="M14.5 5.5a3.5 3.5 0 0 1 3.2 3.2" />
      <path d="m6.2 15.8 2 2" />
    </>
  ),
  generico: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 1.5" />
    </>
  ),
};

export function Icono({
  nombre,
  className = "h-5 w-5",
  ...props
}: { nombre: NombreIcono } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}

export type DeporteIcono = "tenis" | "futbol" | "padel" | "generico";

/** Ícono de deporte para placeholders, tolerante a variantes del nombre. */
export function deporteDeDisciplina(nombre: string): DeporteIcono {
  const clave = normalizarDisciplina(nombre);
  if (clave.includes("tenis")) return "tenis";
  if (clave.includes("futbol")) return "futbol";
  if (clave.includes("padel")) return "padel";
  return "generico";
}
