"use client";

import { useEffect, useState } from "react";

import type { FiltroReservaEstado, ReservaUI } from "@/lib/adaptadores";
import {
  aMapaNombres,
  aReservaUI,
  filtrarReservasPorEstado,
  ordenarReservas,
} from "@/lib/adaptadores";
import type { EquipamientoApi, PagoApi } from "@/lib/api";
import {
  cancelarReserva,
  mensajeDeErrorAdmin,
  obtenerEquipamiento,
  obtenerMisReservas,
  obtenerPago,
} from "@/lib/api";
import { formatearFechaAbreviada } from "@/lib/fechas";

import {
  ErrorConReintento,
  ESTILOS_BOTON_SECUNDARIO,
  estilosBotonSecundario,
} from "../formulario";
import DetalleReserva from "./detalle-reserva";
import {
  etiquetaSocio,
  InsigniaEstadoPago,
  InsigniaEstadoReserva,
} from "./insignias";

type ResultadoReservas = {
  clave: number;
  reservas: ReservaUI[];
  pagos: Record<string, PagoApi | null>;
  equipamiento: EquipamientoApi[];
  avisoPagos: string | null;
  error: string | null;
};

function CeldaPago({
  pago,
  tieneDato,
}: {
  pago: PagoApi | null | undefined;
  tieneDato: boolean;
}) {
  if (!pago) {
    return (
      <span className="text-xs text-slate-500">
        {tieneDato ? "Sin pago" : "Sin dato"}
      </span>
    );
  }
  return <InsigniaEstadoPago estado={pago.estado} />;
}

export default function ReservasClient() {
  const [resultado, setResultado] = useState<ResultadoReservas | null>(null);
  const [intento, setIntento] = useState(0);
  const [filtro, setFiltro] = useState<FiltroReservaEstado>("Todas");
  const [aviso, setAviso] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<ReservaUI | null>(null);
  const [filaEnConfirmacion, setFilaEnConfirmacion] = useState<string | null>(
    null,
  );
  const [cancelando, setCancelando] = useState(false);

  const cargando = resultado === null;
  const actualizando = resultado !== null && resultado.clave !== intento;
  const error = resultado?.error ?? null;
  const pagos = resultado?.pagos ?? {};
  const avisoPagos = resultado?.avisoPagos ?? null;
  const reservas = resultado?.reservas ?? [];
  const visibles = filtrarReservasPorEstado(reservas, filtro);
  const nombres = aMapaNombres(resultado?.equipamiento ?? []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const lista = await obtenerMisReservas();
        const adaptadas = ordenarReservas(lista.map(aReservaUI));

        let equipamiento: EquipamientoApi[] = [];
        if (adaptadas.some((reserva) => reserva.alquiler)) {
          try {
            equipamiento = await obtenerEquipamiento({ incluirInactivos: true });
          } catch {
            equipamiento = [];
          }
        }

        const resultadosPago = await Promise.allSettled(
          adaptadas.map((reserva) => obtenerPago(reserva.id)),
        );
        if (cancelado) return;

        const pagosPorReserva: Record<string, PagoApi | null> = {};
        let primerErrorPago: string | null = null;
        resultadosPago.forEach((resultadoPago, indice) => {
          const reserva = adaptadas[indice];
          if (!reserva) return;
          if (resultadoPago.status === "fulfilled") {
            pagosPorReserva[reserva.id] = resultadoPago.value;
          } else if (primerErrorPago === null) {
            primerErrorPago = mensajeDeErrorAdmin(resultadoPago.reason);
          }
        });

        setResultado({
          clave: intento,
          reservas: adaptadas,
          pagos: pagosPorReserva,
          equipamiento,
          avisoPagos: primerErrorPago,
          error: null,
        });
      } catch (e) {
        if (cancelado) return;
        setResultado({
          clave: intento,
          reservas: [],
          pagos: {},
          equipamiento: [],
          avisoPagos: null,
          error: mensajeDeErrorAdmin(e),
        });
      }
    }

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [intento]);

  async function cancelar(id: string) {
    if (cancelando) return;
    setCancelando(true);
    setAviso(null);
    try {
      await cancelarReserva(id);
      setFilaEnConfirmacion(null);
      setIntento((n) => n + 1);
    } catch (e) {
      setAviso(mensajeDeErrorAdmin(e));
      setFilaEnConfirmacion(null);
    } finally {
      setCancelando(false);
    }
  }

  // Tras una acción de pago se actualiza solo la celda de esa reserva.
  function actualizarPago(pago: PagoApi) {
    setResultado((prev) =>
      prev
        ? { ...prev, pagos: { ...prev.pagos, [pago.reservaId]: pago } }
        : prev,
    );
  }

  const bloqueado = cancelando || actualizando;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reservas</h1>
      </div>

      {aviso ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <span className="flex-1">{aviso}</span>
          <button
            type="button"
            onClick={() => setAviso(null)}
            className={ESTILOS_BOTON_SECUNDARIO}
          >
            Cerrar
          </button>
        </div>
      ) : null}

      {avisoPagos ? (
        <div
          role="alert"
          className="rounded-xl border border-slate-200/80 bg-white p-3 text-sm text-slate-700"
        >
          {avisoPagos}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex w-48 flex-col gap-1">
          <label
            htmlFor="filtro-estado"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Estado
          </label>
          <select
            id="filtro-estado"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as FiltroReservaEstado)}
            disabled={bloqueado}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none disabled:bg-slate-50"
          >
            <option value="Todas">Todas</option>
            <option value="Confirmadas">Confirmadas</option>
            <option value="Canceladas">Canceladas</option>
          </select>
        </div>
        <p className="mb-2 text-xs text-slate-500">
          Ordenadas por fecha y hora. El backend identifica al socio por su id.
        </p>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-500">Cargando reservas...</p>
      ) : error ? (
        <ErrorConReintento
          mensaje={error}
          reintentando={actualizando}
          onReintentar={() => setIntento((n) => n + 1)}
        />
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm px-6 py-12 text-center text-sm text-slate-500">
          {filtro === "Todas"
            ? "No hay reservas registradas."
            : "No hay reservas con ese estado."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="w-28 px-4 py-2 font-medium">Socio</th>
                <th className="w-40 px-4 py-2 font-medium">Cancha</th>
                <th className="w-28 px-4 py-2 font-medium">Fecha</th>
                <th className="w-28 px-4 py-2 font-medium">Hora</th>
                <th className="w-32 px-4 py-2 font-medium">Estado</th>
                <th className="w-28 px-4 py-2 font-medium">Pago</th>
                <th className="px-4 py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((reserva) => {
                const pago = pagos[reserva.id];
                const tieneDato = Object.prototype.hasOwnProperty.call(
                  pagos,
                  reserva.id,
                );
                const enConfirmacion = filaEnConfirmacion === reserva.id;
                return (
                  <tr
                    key={reserva.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td
                      className="px-4 py-3 text-slate-900"
                      title={reserva.usuarioId}
                    >
                      {etiquetaSocio(reserva.usuarioId)}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {reserva.canchaNombre}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {formatearFechaAbreviada(reserva.fecha)}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {reserva.hora} a {reserva.horaFin}
                    </td>
                    <td className="px-4 py-3">
                      <InsigniaEstadoReserva estado={reserva.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <CeldaPago pago={pago} tieneDato={tieneDato} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {enConfirmacion ? (
                          <>
                            <span className="text-xs text-slate-600">
                              ¿Cancelar?
                            </span>
                            <button
                              type="button"
                              onClick={() => void cancelar(reserva.id)}
                              disabled={bloqueado}
                              className={estilosBotonSecundario(bloqueado)}
                            >
                              {cancelando ? "Cancelando..." : "Sí"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilaEnConfirmacion(null)}
                              disabled={bloqueado}
                              className={estilosBotonSecundario(bloqueado)}
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setAviso(null);
                                setDetalle(reserva);
                              }}
                              disabled={bloqueado}
                              className={estilosBotonSecundario(bloqueado)}
                            >
                              Ver detalle
                            </button>
                            {reserva.estado === "confirmada" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setAviso(null);
                                  setFilaEnConfirmacion(reserva.id);
                                }}
                                disabled={bloqueado}
                                className={estilosBotonSecundario(bloqueado)}
                              >
                                Cancelar
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {actualizando ? (
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Actualizando...
            </p>
          ) : null}
        </div>
      )}

      {detalle ? (
        <DetalleReserva
          key={detalle.id}
          reserva={detalle}
          nombres={nombres}
          onCerrar={() => setDetalle(null)}
          onPagoCambiado={actualizarPago}
        />
      ) : null}
    </div>
  );
}


