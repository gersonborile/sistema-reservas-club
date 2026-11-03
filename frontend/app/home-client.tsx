"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  aCanchaUI,
  aEtiquetaDisciplina,
  etiquetaDisciplinas,
  primerTurnoLibreAhora,
} from "@/lib/adaptadores";
import type { DisciplinaApi, TurnoApi } from "@/lib/api";
import {
  mensajeDeError,
  obtenerCanchas,
  obtenerDisciplinas,
  obtenerDisponibilidad,
} from "@/lib/api";
import type { Reserva } from "@/lib/mock-reservas";
import { obtenerProximaReserva } from "@/lib/mock-reservas";
import {
  diaSemana,
  formatearFecha,
  obtenerFechaLocalHoy,
  obtenerHoraLocalAhora,
  sumarUnaHora,
} from "@/lib/fechas";
import { useSesion } from "@/lib/use-sesion";

type DisponibleAhora = {
  canchaId: string;
  nombre: string;
  disciplinas: string;
  turno: TurnoApi;
};

type DatosHome = {
  clave: number;
  disciplinas: DisciplinaApi[];
  disponibles: DisponibleAhora[];
  error: string | null;
};

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
  const { claims, usuario } = useSesion();
  const nombre = usuario?.nombre ?? "";
  const proximaReserva = claims ? obtenerProximaReserva(claims.userId) : null;
  const [datos, setDatos] = useState<DatosHome | null>(null);
  const [intento, setIntento] = useState(0);
  const cargando = datos?.clave !== intento;
  const error = datos?.error ?? null;
  const disciplinas = datos?.disciplinas ?? [];
  const disponiblesAhora = datos?.disponibles ?? [];

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const [listaDisciplinas, canchas] = await Promise.all([
          obtenerDisciplinas(),
          obtenerCanchas({ estado: "DISPONIBLE" }),
        ]);
        const fecha = obtenerFechaLocalHoy();
        const ahora = obtenerHoraLocalAhora();
        const libres = await Promise.all(
          canchas.map(aCanchaUI).map(async (cancha) => ({
            cancha,
            turno: primerTurnoLibreAhora(
              await obtenerDisponibilidad(cancha.id, fecha),
              ahora,
            ),
          })),
        );
        const disponibles: DisponibleAhora[] = [];
        for (const { cancha, turno } of libres) {
          if (!turno) continue;
          disponibles.push({
            canchaId: cancha.id,
            nombre: cancha.nombre,
            disciplinas: etiquetaDisciplinas(cancha),
            turno,
          });
        }
        if (cancelado) return;
        setDatos({
          clave: intento,
          disciplinas: listaDisciplinas,
          disponibles: disponibles.slice(0, 3),
          error: null,
        });
      } catch (e) {
        if (cancelado) return;
        setDatos({
          clave: intento,
          disciplinas: [],
          disponibles: [],
          error: mensajeDeError(e),
        });
      }
    }
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [intento]);

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
          {cargando ? (
            <p className="text-sm text-neutral-500">Cargando...</p>
          ) : error ? (
            <p className="text-sm text-red-600">
              No se pudieron cargar las disciplinas.
            </p>
          ) : disciplinas.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay disciplinas cargadas.</p>
          ) : null}
          <div>
            {disciplinas.map((disciplina, indice) => (
              <Link
                key={disciplina.id}
                href={`/canchas?disciplina=${encodeURIComponent(disciplina.nombre)}`}
                className={`flex items-center gap-3 rounded py-3 hover:bg-neutral-50 ${
                  indice > 0 ? "border-t border-neutral-200" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-8 w-8 flex-shrink-0 rounded bg-neutral-200"
                />
                <span className="text-sm font-medium text-neutral-900">
                  {aEtiquetaDisciplina(disciplina.nombre)}
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
        {cargando ? (
          <p className="text-sm text-neutral-500">Cargando canchas...</p>
        ) : error ? (
          <div>
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => setIntento((n) => n + 1)}
              className="mt-3 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Reintentar
            </button>
          </div>
        ) : disponiblesAhora.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No hay canchas disponibles en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {disponiblesAhora.map(({ canchaId, nombre, disciplinas, turno }) => (
              <div
                key={`${canchaId}-${turno.id}`}
                className="rounded border border-neutral-200 p-4"
              >
                <p className="font-bold text-neutral-900">{nombre}</p>
                <p className="text-sm text-neutral-500">{disciplinas}</p>
                <p className="mb-3 mt-2 text-sm font-bold text-green-600">
                  Libre {turno.hora_inicio.slice(0, 5)}
                </p>
                <Link
                  href={`/canchas/${canchaId}/reservar?fecha=${obtenerFechaLocalHoy()}&hora=${turno.hora_inicio.slice(0, 5)}&turnoId=${turno.id}`}
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
