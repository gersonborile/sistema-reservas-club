"use client";

import type { ReservaUI } from "@/lib/adaptadores";
import { textoItemsAlquiler } from "@/lib/adaptadores";
import type { PagoApi } from "@/lib/api";
import { formatearFecha, formatearFechaAbreviada } from "@/lib/fechas";

import { estilosBotonSecundario } from "../formulario";
import { etiquetaSocio } from "./insignias";
import SeccionPago from "./seccion-pago";

export default function DetalleReserva({
  reserva,
  nombres,
  onCerrar,
  onPagoCambiado,
}: {
  reserva: ReservaUI;
  nombres: Record<string, string>;
  onCerrar: () => void;
  onPagoCambiado: (pago: PagoApi) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-neutral-900/40"
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="Detalle de la reserva"
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-neutral-800 bg-white"
      >
        <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Detalle de la reserva
            </h2>
            <p className="text-xs text-neutral-500">
              {formatearFechaAbreviada(reserva.fecha)}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className={estilosBotonSecundario(false)}
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-5">
          <section className="flex flex-col gap-2">
            <h3 className="text-[10px] uppercase tracking-wide text-neutral-500">
              Reserva
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-neutral-500">Socio</dt>
              <dd className="text-neutral-900">{etiquetaSocio(reserva.usuarioId)}</dd>
              <dt className="text-neutral-500">Cancha</dt>
              <dd className="text-neutral-900">{reserva.canchaNombre}</dd>
              <dt className="text-neutral-500">Fecha</dt>
              <dd className="text-neutral-900">{formatearFecha(reserva.fecha)}</dd>
              <dt className="text-neutral-500">Hora</dt>
              <dd className="text-neutral-900">
                {reserva.hora} a {reserva.horaFin}
              </dd>
              <dt className="text-neutral-500">Estado</dt>
              <dd className="text-neutral-900">
                {reserva.estado === "confirmada" ? "Confirmada" : "Cancelada"}
              </dd>
            </dl>
            <p className="text-xs text-neutral-500">
              El backend identifica al socio por su id.
            </p>
          </section>

          <section className="flex flex-col gap-2 border-t border-neutral-200 pt-4">
            <h3 className="text-[10px] uppercase tracking-wide text-neutral-500">
              Equipamiento
            </h3>
            {reserva.alquiler ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-900">
                  {textoItemsAlquiler(reserva.alquiler.items, nombres)}
                </span>
                <span className="font-medium text-neutral-900">
                  ${reserva.alquiler.total}
                </span>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Sin equipamiento alquilado.</p>
            )}
          </section>

          <SeccionPago reserva={reserva} onPagoCambiado={onPagoCambiado} />
        </div>
      </div>
    </div>
  );
}
