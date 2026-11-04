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
  obtenerTurnos,
} from "@/lib/api";
import type { DisciplinaApi } from "@/lib/api";
import { obtenerFechaLocalHoy } from "@/lib/fechas";

const CUALQUIER_HORARIO = "Cualquiera";

export default function CanchasClient() {
  const searchParams = useSearchParams();
  const disciplinaParam = searchParams.get("disciplina") ?? "Todas";
  // key: al cambiar la disciplina de la URL se reinician los filtros.
  return <ListadoCanchas key={disciplinaParam} disciplinaInicial={disciplinaParam} />;
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

  const [disciplinaEnEdicion, setDisciplinaEnEdicion] = useState(disciplinaInicial);
  const [fechaEnEdicion, setFechaEnEdicion] = useState(obtenerFechaLocalHoy);

  const [disciplinaAplicada, setDisciplinaAplicada] = useState(disciplinaInicial);
  const [fechaAplicada, setFechaAplicada] = useState(obtenerFechaLocalHoy);
  const [horario, setHorario] = useState(CUALQUIER_HORARIO);

  const clave = `${disciplinaAplicada}|${fechaAplicada}|${intento}`;
  const cargando = resultado?.clave !== clave;
  const error = resultado?.error ?? null;
  const disciplinas = resultado?.disciplinas ?? [];
  const canchas = resultado?.canchas ?? [];
  const franjasPorCancha = resultado?.franjasPorCancha ?? {};
  // Las opciones de horario salen de los turnos cargados; si el elegido ya no
  // existe en la búsqueda actual, se vuelve a "Cualquiera".
  const horarios = Array.from(
    new Set(
      Object.values(franjasPorCancha)
        .flat()
        .map((franja) => franja.hora),
    ),
  ).sort();
  const horarioElegido = horarios.includes(horario) ? horario : CUALQUIER_HORARIO;

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const [listaDisciplinas, listaCanchas] = await Promise.all([
          obtenerDisciplinas(),
          obtenerCanchas(
            disciplinaAplicada === "Todas" ? {} : { disciplina: disciplinaAplicada },
          ),
        ]);
        const activas = listaCanchas.map(aCanchaUI).filter((cancha) => cancha.reservable);
        const listasFranjas = await Promise.all(
          activas.map((cancha) =>
            obtenerTurnos({ canchaId: cancha.id, fecha: fechaAplicada }),
          ),
        );
        const franjas: Record<string, FranjaUI[]> = {};
        activas.forEach((cancha, indice) => {
          franjas[cancha.id] = listasFranjas[indice].map(aFranjaUI);
        });
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
    setFechaAplicada(fechaEnEdicion);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        Canchas y disponibilidad
      </h1>
      <p className="text-neutral-600 mb-6">
        Elegí disciplina, fecha y horario para ver los turnos libres
      </p>

      <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Disciplina
          </label>
          <select
            value={disciplinaEnEdicion}
            onChange={(e) => setDisciplinaEnEdicion(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded"
          >
            <option value="Todas">Todas</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.nombre}>
                {aEtiquetaDisciplina(d.nombre)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Fecha
          </label>
          <input
            type="date"
            value={fechaEnEdicion}
            onChange={(e) => setFechaEnEdicion(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Horario
          </label>
          <select
            value={horarioElegido}
            onChange={(e) => setHorario(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded"
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
          className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800"
        >
          Buscar
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-neutral-500">Cargando canchas...</p>
      ) : error ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => setIntento((n) => n + 1)}
            className="mt-3 px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800"
          >
            Reintentar
          </button>
        </div>
      ) : canchas.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No hay canchas para esta búsqueda.
        </p>
      ) : (
        <div className="space-y-4">
          {canchas.map((cancha) => {
            const franjas = franjasPorCancha[cancha.id] ?? [];
            return (
              <div
                key={cancha.id}
                className="bg-white border border-neutral-200 rounded-lg p-4 flex gap-4"
              >
                <div className="w-24 h-24 bg-neutral-200 rounded flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="font-semibold text-neutral-900">
                    {cancha.nombre}
                  </h2>
                  <p className="text-sm text-neutral-600 mb-3">
                    {etiquetaDisciplinas(cancha)}
                  </p>
                  {franjas.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      No hay turnos para esta fecha.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {franjas.map((franja) => {
                        const mostrarFranja =
                          horarioElegido === CUALQUIER_HORARIO ||
                          horarioElegido === franja.hora;
                        if (!mostrarFranja) return null;

                        if (franja.ocupada) {
                          return (
                            <button
                              key={franja.id}
                              type="button"
                              disabled
                              className="px-3 py-1 text-sm bg-neutral-100 text-neutral-400 rounded border border-neutral-300 line-through cursor-not-allowed"
                            >
                              {franja.hora}
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={franja.id}
                            href={`/canchas/${cancha.id}/reservar?fecha=${fechaAplicada}&hora=${franja.hora}&turnoId=${franja.id}`}
                            className="px-3 py-1 text-sm bg-white text-neutral-900 rounded border border-neutral-300 hover:bg-neutral-50"
                          >
                            {franja.hora}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
