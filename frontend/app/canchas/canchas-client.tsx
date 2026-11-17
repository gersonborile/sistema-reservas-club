"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { CanchaUI, FranjaUI } from "@/lib/adaptadores";
import {
  aCanchaUI,
  aEtiquetaDisciplina,
  aFranjaUI,
  etiquetaDisciplinas,
} from "@/lib/adaptadores";
import {
  mensajeDeError,
  obtenerCanchas,
  obtenerDisciplinas,
  obtenerTurnosDeFecha,
} from "@/lib/api";
import type { DisciplinaApi } from "@/lib/api";
import { obtenerFechaLocalHoy } from "@/lib/fechas";

const CUALQUIER_HORARIO = "Cualquiera";

export default function CanchasClient() {
  const searchParams = useSearchParams();
  const disciplinaParam = searchParams.get("disciplina") ?? "Todas";
  return (
    <ListadoCanchas
      key={disciplinaParam}
      disciplinaInicial={disciplinaParam}
    />
  );
}

type Resultado = {
  clave: string;
  disciplinas: DisciplinaApi[];
  canchas: CanchaUI[];
  franjasPorCancha: Record<string, FranjaUI[]>;
  error: string | null;
};

function ListadoCanchas({ disciplinaInicial }: { disciplinaInicial: string }) {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [intento, setIntento] = useState(0);

  const [disciplinaEnEdicion, setDisciplinaEnEdicion] =
    useState(disciplinaInicial);
  const [fechaEnEdicion, setFechaEnEdicion] = useState(obtenerFechaLocalHoy);

  const [disciplinaAplicada, setDisciplinaAplicada] =
    useState(disciplinaInicial);
  const [fechaAplicada, setFechaAplicada] = useState(obtenerFechaLocalHoy);
  const [horario, setHorario] = useState(CUALQUIER_HORARIO);

  const clave = `${disciplinaAplicada}|${fechaAplicada}|${intento}`;
  const cargando = resultado?.clave !== clave;
  const error = resultado?.error ?? null;
  const disciplinas = resultado?.disciplinas ?? [];
  const canchas = resultado?.canchas ?? [];
  const franjasPorCancha = resultado?.franjasPorCancha ?? {};
  const horarios = Array.from(
    new Set(
      Object.values(franjasPorCancha)
        .flat()
        .map((franja) => franja.hora),
    ),
  ).sort();
  const horarioElegido = horarios.includes(horario) ? horario : CUALQUIER_HORARIO;
  const totalTurnos = Object.values(franjasPorCancha).flat().length;

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const [listaDisciplinas, listaCanchas, turnos] = await Promise.all([
          obtenerDisciplinas(),
          obtenerCanchas(
            disciplinaAplicada === "Todas"
              ? {}
              : { disciplina: disciplinaAplicada },
          ),
          obtenerTurnosDeFecha(fechaAplicada),
        ]);
        const activas = listaCanchas
          .map(aCanchaUI)
          .filter((cancha) => cancha.reservable);
        const ids = new Set(activas.map((cancha) => cancha.id));
        const franjas: Record<string, FranjaUI[]> = {};
        for (const cancha of activas) franjas[cancha.id] = [];
        for (const turno of turnos) {
          if (!ids.has(turno.cancha_id)) continue;
          franjas[turno.cancha_id].push(aFranjaUI(turno));
        }
        if (cancelado) return;
        setResultado({
          clave,
          disciplinas: listaDisciplinas,
          canchas: activas,
          franjasPorCancha: franjas,
          error: null,
        });
      } catch (e) {
        if (cancelado) return;
        setResultado({
          clave,
          disciplinas: [],
          canchas: [],
          franjasPorCancha: {},
          error: mensajeDeError(e),
        });
      }
    }
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [clave, disciplinaAplicada, fechaAplicada]);

  function aplicarFiltros() {
    setDisciplinaAplicada(disciplinaEnEdicion);
    setFechaAplicada(fechaEnEdicion || obtenerFechaLocalHoy());
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Canchas y disponibilidad
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Elegí disciplina, fecha y horario para ver los turnos libres
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Disciplina
          </label>
          <select
            value={disciplinaEnEdicion}
            onChange={(e) => setDisciplinaEnEdicion(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="Todas">Todas</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.nombre}>
                {aEtiquetaDisciplina(d.nombre)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px] flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Fecha
          </label>
          <input
            type="date"
            value={fechaEnEdicion}
            onChange={(e) => setFechaEnEdicion(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        <div className="min-w-[160px] flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Horario
          </label>
          <select
            value={horarioElegido}
            onChange={(e) => setHorario(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          >
            {[CUALQUIER_HORARIO, ...horarios].map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={aplicarFiltros}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Buscar
        </button>
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 gap-6">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-2xl border border-slate-200/80 bg-white"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => setIntento((n) => n + 1)}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Reintentar
          </button>
        </div>
      ) : canchas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
          No hay canchas para esta búsqueda.
        </p>
      ) : totalTurnos === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
          No hay turnos cargados para esta fecha.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {canchas.map((cancha) => {
            const franjas = franjasPorCancha[cancha.id] ?? [];
            const franjasVisibles = franjas.filter(
              (franja) =>
                horarioElegido === CUALQUIER_HORARIO ||
                horarioElegido === franja.hora,
            );
            if (franjasVisibles.length === 0) return null;
            return (
              <div
                key={cancha.id}
                className="flex flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:p-6"
              >
                <div className="flex h-28 w-full flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 sm:h-28 sm:w-36">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {cancha.nombre.split(" ")[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {cancha.nombre}
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {etiquetaDisciplinas(cancha)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {cancha.ubicacion} · Capacidad {cancha.capacidad}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {franjasVisibles.map((franja) => {
                        if (franja.ocupada) {
                          return (
                            <button
                              key={franja.id}
                              type="button"
                              disabled
                              className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-slate-400 line-through"
                            >
                              {franja.hora}
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={franja.id}
                            href={`/canchas/${cancha.id}/reservar?fecha=${fechaAplicada}&hora=${franja.hora}&turnoId=${franja.id}`}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                          >
                            {franja.hora}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
