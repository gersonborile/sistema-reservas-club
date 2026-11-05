"use client";

import { useEffect, useState } from "react";

import type { ReservaUI } from "@/lib/adaptadores";
import { accionesDePago, montoSugerido } from "@/lib/adaptadores";
import type { MetodoPago, PagoApi } from "@/lib/api";
import {
  anularPago,
  confirmarPago,
  mensajeDeErrorAdmin,
  obtenerPago,
  registrarPago,
} from "@/lib/api";
import { formatearFecha } from "@/lib/fechas";

import { estilosBotonPrincipal, estilosBotonSecundario } from "../formulario";
import { InsigniaEstadoPago } from "./insignias";

type ResultadoPago = {
  clave: number;
  pago: PagoApi | null;
  error: string | null;
};

const ETIQUETAS_METODO: Record<MetodoPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
};

/**
 * Gestión del pago de una reserva: lo consulta, y permite registrarlo,
 * confirmar el cobro o anularlo según `accionesDePago`. Tras una acción
 * actualiza solo este pago (con la respuesta del backend) y avisa al padre.
 */
export default function SeccionPago({
  reserva,
  onPagoCambiado,
}: {
  reserva: ReservaUI;
  onPagoCambiado: (pago: PagoApi) => void;
}) {
  const [resultado, setResultado] = useState<ResultadoPago | null>(null);
  const [intento, setIntento] = useState(0);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [monto, setMonto] = useState(() => {
    const sugerido = montoSugerido(reserva);
    return sugerido === null ? "" : String(sugerido);
  });
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");

  const cargandoPago = resultado?.clave !== intento;
  const pago = resultado?.pago ?? null;
  const errorPago = resultado?.error ?? null;
  // Si no se pudo consultar el pago no se sabe si ya existe uno: sin acciones.
  const acciones =
    cargandoPago || errorPago ? [] : accionesDePago(reserva.estado, pago);
  const bloqueado = accionEnCurso || cargandoPago;

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const actual = await obtenerPago(reserva.id);
        if (cancelado) return;
        setResultado({ clave: intento, pago: actual, error: null });
      } catch (e) {
        if (cancelado) return;
        setResultado({
          clave: intento,
          pago: null,
          error: mensajeDeErrorAdmin(e),
        });
      }
    }

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [reserva.id, intento]);

  async function ejecutar(accion: () => Promise<PagoApi>) {
    if (accionEnCurso) return;
    setAccionEnCurso(true);
    setErrorAccion(null);
    try {
      const nuevo = await accion();
      setResultado((prev) => ({
        clave: prev?.clave ?? intento,
        pago: nuevo,
        error: null,
      }));
      onPagoCambiado(nuevo);
    } catch (e) {
      setErrorAccion(mensajeDeErrorAdmin(e));
    } finally {
      setAccionEnCurso(false);
    }
  }

  function registrar() {
    const valor = Number(monto);
    if (monto.trim() === "" || !Number.isFinite(valor) || valor <= 0) {
      setErrorAccion("Ingresá un monto mayor a 0.");
      return;
    }
    void ejecutar(() =>
      registrarPago(reserva.id, { monto: valor, metodoPago: metodo }),
    );
  }

  function confirmar() {
    if (!pago) return;
    const id = pago.id;
    void ejecutar(() => confirmarPago(id));
  }

  function anular() {
    if (!pago) return;
    const id = pago.id;
    void ejecutar(() => anularPago(id));
  }

  return (
    <section className="flex flex-col gap-3 border-t border-neutral-200 pt-4">
      <h3 className="text-[10px] uppercase tracking-wide text-neutral-500">
        Pago
      </h3>

      {cargandoPago ? (
        <p className="text-sm text-neutral-500">Cargando pago...</p>
      ) : errorPago ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-red-600">{errorPago}</p>
          <button
            type="button"
            onClick={() => setIntento((n) => n + 1)}
            className={estilosBotonSecundario(false)}
          >
            Reintentar
          </button>
        </div>
      ) : pago ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500">Estado</span>
            <InsigniaEstadoPago estado={pago.estado} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-neutral-500">Monto</dt>
            <dd className="text-neutral-900">${pago.monto}</dd>
            <dt className="text-neutral-500">Método</dt>
            <dd className="text-neutral-900">
              {ETIQUETAS_METODO[pago.metodoPago]}
            </dd>
            {pago.fechaPago ? (
              <>
                <dt className="text-neutral-500">Fecha de pago</dt>
                <dd className="text-neutral-900">
                  {formatearFecha(pago.fechaPago.slice(0, 10))}
                </dd>
              </>
            ) : null}
          </dl>
          {pago.estado === "ANULADO" ? (
            <p className="text-xs text-neutral-500">
              Pago anulado: solo lectura.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Sin pago registrado.</p>
      )}

      {acciones.includes("registrar") ? (
        <div className="flex flex-col gap-3 rounded border border-neutral-300 p-3">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label
                htmlFor="monto"
                className="text-[10px] uppercase tracking-wide text-neutral-500"
              >
                Monto
              </label>
              <input
                id="monto"
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                disabled={bloqueado}
                className="h-9 rounded border border-neutral-300 bg-white px-2 text-sm text-neutral-900 disabled:bg-neutral-100"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label
                htmlFor="metodo"
                className="text-[10px] uppercase tracking-wide text-neutral-500"
              >
                Método
              </label>
              <select
                id="metodo"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as MetodoPago)}
                disabled={bloqueado}
                className="h-9 rounded border border-neutral-300 bg-white px-2 text-sm text-neutral-900 disabled:bg-neutral-100"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Monto sugerido por el alquiler; podés editarlo.
          </p>
          <button
            type="button"
            onClick={registrar}
            disabled={bloqueado}
            className={estilosBotonPrincipal(bloqueado)}
          >
            {accionEnCurso ? "Registrando..." : "Registrar pago"}
          </button>
        </div>
      ) : null}

      {acciones.includes("confirmar") || acciones.includes("anular") ? (
        <div className="flex flex-wrap gap-2">
          {acciones.includes("confirmar") ? (
            <button
              type="button"
              onClick={confirmar}
              disabled={bloqueado}
              className={estilosBotonPrincipal(bloqueado)}
            >
              {accionEnCurso ? "Procesando..." : "Confirmar cobro"}
            </button>
          ) : null}
          {acciones.includes("anular") ? (
            <button
              type="button"
              onClick={anular}
              disabled={bloqueado}
              className={estilosBotonSecundario(bloqueado)}
            >
              {accionEnCurso ? "Procesando..." : "Anular pago"}
            </button>
          ) : null}
        </div>
      ) : null}

      {errorAccion ? (
        <div
          role="alert"
          className="rounded border border-neutral-800 bg-neutral-100 p-3 text-sm text-red-600"
        >
          {errorAccion}
        </div>
      ) : null}
    </section>
  );
}
