"use client";

import Link from "next/link";

import type { Disciplina, Reserva } from "@/lib/mock-reservas";
import { obtenerDisponiblesAhora, obtenerProximaReserva } from "@/lib/mock-reservas";
import {
  diaSemana,
  formatearFecha,
  obtenerFechaLocalHoy,
  sumarUnaHora,
} from "@/lib/fechas";
import { leerClaims, leerToken } from "@/lib/sesion";

const ACCESOS_RAPIDOS: Disciplina[] = ["Tenis", "Fútbol 5", "Pádel"];

function formatearMomento(reserva: Reserva): string {
  const rango = `${reserva.hora} a ${sumarUnaHora(reserva.hora)} hs`;
  if (reserva.fecha === obtenerFechaLocalHoy()) {
    return `Hoy, ${rango}`;
  }
  return `${diaSemana(reserva.fecha)} ${formatearFecha(reserva.fecha)}, ${rango}`;
}

function formatearEquipamiento(reserva: Reserva): string {
  if (reserva.equipamiento.length === 0) return "Sin equipamiento";
  return reserva.equipamiento
    .map((item) => `${item.cantidad} ${item.nombre.toLowerCase()}`)
    .join(", ");
}

export default function HomeClient() {
  const token = leerToken();
  const claims = token ? leerClaims(token) : null;
  const nombre = claims?.nombre ?? "";
  const proximaReserva = claims ? obtenerProximaReserva(claims.userId) : null;
  const disponiblesAhora = obtenerDisponiblesAhora().slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Hola, {nombre}</h1>
          <p className="text-neutral-600">¿Qué querés hacer hoy?</p>
        </div>
        <Link
          href="/canchas"
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Reservar una cancha
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[65fr_35fr]">
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Próxima reserva
          </h2>
          {proximaReserva ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-bold text-neutral-900">
                  {proximaReserva.disciplina} · {proximaReserva.canchaNombre}
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  {formatearMomento(proximaReserva)}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Equipamiento: {formatearEquipamiento(proximaReserva)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                >
                  Ver detalle
                </button>
                <button
                  type="button"
                  className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No tenés reservas próximas.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Accesos rápidos
          </h2>
          <div>
            {ACCESOS_RAPIDOS.map((disciplina, indice) => (
              <Link
                key={disciplina}
                href={`/canchas?disciplina=${encodeURIComponent(disciplina)}`}
                className={`flex items-center gap-3 rounded py-3 hover:bg-neutral-50 ${
                  indice > 0 ? "border-t border-neutral-200" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-8 w-8 flex-shrink-0 rounded bg-neutral-200"
                />
                <span className="text-sm font-medium text-neutral-900">
                  {disciplina}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Canchas disponibles ahora
        </h2>
        {disponiblesAhora.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No hay canchas disponibles en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {disponiblesAhora.map(({ cancha, hora }) => (
              <div
                key={`${cancha.id}-${hora}`}
                className="rounded border border-neutral-200 p-4"
              >
                <p className="font-bold text-neutral-900">{cancha.nombre}</p>
                <p className="text-sm text-neutral-500">{cancha.disciplina}</p>
                <p className="mb-3 mt-2 text-sm font-bold text-green-600">
                  Libre {hora}
                </p>
                <Link
                  href={`/canchas/${cancha.id}/reservar?fecha=${obtenerFechaLocalHoy()}&hora=${hora}`}
                  className="block w-full rounded bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Reservar
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
