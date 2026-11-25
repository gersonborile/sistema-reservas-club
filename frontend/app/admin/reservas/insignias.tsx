import type { ReservaUI } from "@/lib/adaptadores";
import type { EstadoPago } from "@/lib/api";

const ETIQUETAS_ESTADO_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  ANULADO: "Anulado",
};

const CLASES_ESTADO_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70",
  PAGADO: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60",
  ANULADO: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70",
};

/** El backend no devuelve el nombre del socio: se muestra su id abreviado. */
export function etiquetaSocio(usuarioId: string): string {
  return usuarioId.length > 8 ? `${usuarioId.slice(0, 8)}…` : usuarioId;
}

export function InsigniaEstadoPago({ estado }: { estado: EstadoPago }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CLASES_ESTADO_PAGO[estado]}`}
    >
      {ETIQUETAS_ESTADO_PAGO[estado]}
    </span>
  );
}

export function InsigniaEstadoReserva({
  estado,
}: {
  estado: ReservaUI["estado"];
}) {
  if (estado === "cancelada") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/70">
        Cancelada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
      Confirmada
    </span>
  );
}
