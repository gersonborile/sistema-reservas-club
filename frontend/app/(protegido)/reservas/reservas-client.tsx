"use client";

import Link from "next/link";
import { useState } from "react";

import type { Reserva } from "@/lib/mock-reservas";
import {
  cancelarReserva,
  obtenerReservasDeUsuario,
  puedeCancelar,
} from "@/lib/mock-reservas";
import { formatearFechaAbreviada, sumarUnaHora } from "@/lib/fechas";
import { leerClaims, leerToken } from "@/lib/sesion";

type Pestana = "Todas" | "Confirmadas" | "Canceladas";

const PESTANAS: Pestana[] = ["Todas", "Confirmadas", "Canceladas"];

function formatearRango(reserva: Reserva): string {
  return `${formatearFechaAbreviada(reserva.fecha)} · ${reserva.hora} a ${sumarUnaHora(
    reserva.hora
  )}`;
}

function formatearEquipamiento(reserva: Reserva): string {
  if (reserva.equipamiento.length === 0) return "Sin equipamiento";
  return reserva.equipamiento
    .map((item) => `${item.cantidad} ${item.nombre.toLowerCase()}`)
    .join(", ");
}

function InsigniaEstado({ estado }: { estado: Reserva["estado"] }) {
  if (estado === "cancelada") {
    return (
      <span className="inline-block rounded border border-neutral-300 px-2 py-0.5 text-xs font-medium text-neutral-500">
        Cancelada
      </span>
    );
  }
  return (
    <span className="inline-block rounded border border-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-800">
      Confirmada
    </span>
  );
}

export default function ReservasClient() {
  const token = leerToken();
  const claims = token ? leerClaims(token) : null;
  const usuarioId = claims?.userId;

  const [pestana, setPestana] = useState<Pestana>("Todas");
  const [reservas, setReservas] = useState<Reserva[]>(() =>
    usuarioId ? obtenerReservasDeUsuario(usuarioId) : []
  );
  const [filaEnConfirmacion, setFilaEnConfirmacion] = useState<string | null>(
    null
  );

  const ahora = new Date();

  const reservasVisibles = reservas.filter((reserva) => {
    if (pestana === "Todas") return true;
    if (pestana === "Confirmadas") {
      return reserva.estado === "confirmada" || reserva.estado === "pendiente";
    }
    return reserva.estado === "cancelada";
  });

  function elegirPestana(nueva: Pestana) {
    setPestana(nueva);
    setFilaEnConfirmacion(null);
  }

  function confirmarCancelacion(id: string) {
    if (!usuarioId) return;
    try {
      const actualizada = cancelarReserva(id, usuarioId);
      setReservas((prev) =>
        prev.map((r) => (r.id === actualizada.id ? actualizada : r))
      );
    } catch {
      setReservas(obtenerReservasDeUsuario(usuarioId));
    }
    setFilaEnConfirmacion(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">Mis reservas</h1>
        <Link
          href="/canchas"
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Nueva reserva
        </Link>
      </div>

      <div className="mb-6 border-b border-neutral-200">
        <nav className="flex gap-6" aria-label="Filtrar por estado">
          {PESTANAS.map((nombre) => (
            <button
              key={nombre}
              type="button"
              onClick={() => elegirPestana(nombre)}
              aria-current={pestana === nombre ? "page" : undefined}
              className={`pb-3 text-sm ${
                pestana === nombre
                  ? "-mb-px border-b-2 border-neutral-900 font-bold text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {nombre}
            </button>
          ))}
        </nav>
      </div>

      {reservasVisibles.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-neutral-500">
            No tenés reservas en esta pestaña.
          </p>
          <Link
            href="/canchas"
            className="mt-4 inline-block rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Reservar una cancha
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3 font-medium">Cancha</th>
                  <th className="px-4 py-3 font-medium">Fecha y horario</th>
                  <th className="px-4 py-3 font-medium">Equipamiento</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {reservasVisibles.map((reserva) => {
                  const sinEquipamiento = reserva.equipamiento.length === 0;
                  const puede = puedeCancelar(reserva, ahora);
                  const confirmando = filaEnConfirmacion === reserva.id;

                  return (
                    <tr
                      key={reserva.id}
                      className="border-b border-neutral-100 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="h-9 w-9 flex-shrink-0 rounded bg-neutral-200"
                          />
                          <div>
                            <p className="font-bold text-neutral-900">
                              {reserva.canchaNombre}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {reserva.disciplina}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {formatearRango(reserva)}
                      </td>
                      <td
                        className={`px-4 py-3 ${
                          sinEquipamiento ? "text-neutral-400" : "text-neutral-700"
                        }`}
                      >
                        {formatearEquipamiento(reserva)}
                      </td>
                      <td className="px-4 py-3">
                        <InsigniaEstado estado={reserva.estado} />
                      </td>
                      <td className="px-4 py-3">
                        {confirmando ? (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <span className="text-sm text-neutral-700">
                              ¿Cancelar esta reserva?
                            </span>
                            <button
                              type="button"
                              onClick={() => confirmarCancelacion(reserva.id)}
                              className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                            >
                              Sí, cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilaEnConfirmacion(null)}
                              className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                            >
                              Ver detalle
                            </button>
                            <button
                              type="button"
                              disabled={!puede}
                              onClick={() =>
                                setFilaEnConfirmacion(reserva.id)
                              }
                              className={`rounded border px-3 py-1.5 text-sm font-medium ${
                                puede
                                  ? "border-neutral-300 bg-white text-red-600 hover:bg-red-50"
                                  : "border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed"
                              }`}
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-neutral-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>
          Se puede cancelar hasta 2 horas antes del turno. El equipamiento
          reservado vuelve al stock al cancelar.
        </span>
      </p>
    </div>
  );
}
