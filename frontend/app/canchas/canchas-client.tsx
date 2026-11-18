"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Esqueleto } from "@/app/componentes/ui/esqueleto";
import { EstadoError, EstadoVacio } from "@/app/componentes/ui/estado";
import ImagenDisciplina from "@/app/componentes/ui/imagen-disciplina";
import { Icono } from "@/app/componentes/ui/iconos";
import { Insignia } from "@/app/componentes/ui/insignia";
import type { CanchaUI, FranjaUI } from "@/lib/adaptadores";
import {
  aCanchaUI,
  aEtiquetaDisciplina,
  aFranjaUI,
  etiquetaDisciplinas,
  etiquetaEstadoCancha,
} from "@/lib/adaptadores";
import {
  mensajeDeError,
  obtenerCanchas,
  obtenerDisciplinas,
  obtenerTurnosDeFecha,
} from "@/lib/api";
import type { DisciplinaApi } from "@/lib/api";
import {
  formatearFechaAbreviada,
  obtenerFechaLocalHoy,
} from "@/lib/fechas";

const CUALQUIER_HORARIO = "Cualquiera";
const MAX_CHIPS = 4;

const ESTILO_CONTROL =
  "w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3.5 py-2.5 text-sm font-medium text-on-surface outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10";

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
  const totalLibres = Object.values(franjasPorCancha)
    .flat()
    .filter((franja) => !franja.ocupada).length;

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
    setHorario(CUALQUIER_HORARIO);
  }

  function limpiarFiltros() {
    const hoy = obtenerFechaLocalHoy();
    setDisciplinaEnEdicion("Todas");
    setFechaEnEdicion(hoy);
    setDisciplinaAplicada("Todas");
    setFechaAplicada(hoy);
    setHorario(CUALQUIER_HORARIO);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-secondary">Disponibilidad</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-primary sm:text-4xl">
            Canchas y turnos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
            Elegí disciplina, fecha y horario. Los turnos verdes se pueden
            reservar; el detalle muestra la grilla completa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Insignia tono="verde">
            <Icono nombre="calendario" className="h-3.5 w-3.5" />
            {formatearFechaAbreviada(fechaAplicada)}
          </Insignia>
          {!cargando && !error ? (
            <Insignia tono={totalLibres > 0 ? "verde" : "amarillo"}>
              {totalLibres > 0
                ? `${totalLibres} turnos libres`
                : "Sin turnos libres"}
            </Insignia>
          ) : null}
        </div>
      </div>

      <div className="mt-7 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <div className="min-w-0">
            <label
              htmlFor="filtro-disciplina"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Disciplina
            </label>
            <select
              id="filtro-disciplina"
              value={disciplinaEnEdicion}
              onChange={(e) => setDisciplinaEnEdicion(e.target.value)}
              className={ESTILO_CONTROL}
            >
              <option value="Todas">Todas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.nombre}>
                  {aEtiquetaDisciplina(d.nombre)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="filtro-fecha"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Fecha
            </label>
            <input
              id="filtro-fecha"
              type="date"
              value={fechaEnEdicion}
              onChange={(e) => setFechaEnEdicion(e.target.value)}
              className={ESTILO_CONTROL}
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="filtro-horario"
              className="mb-1.5 block text-sm font-semibold text-on-surface"
            >
              Horario
            </label>
            <select
              id="filtro-horario"
              value={horarioElegido}
              onChange={(e) => setHorario(e.target.value)}
              className={ESTILO_CONTROL}
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <Icono nombre="buscar" className="h-4 w-4" />
            Buscar
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest"
            >
              <Esqueleto className="aspect-[16/8] rounded-none" />
              <div className="space-y-3 p-5">
                <Esqueleto className="h-6 w-44" />
                <Esqueleto className="h-4 w-32" />
                <div className="flex gap-2">
                  <Esqueleto className="h-7 w-24 rounded-full" />
                  <Esqueleto className="h-7 w-28 rounded-full" />
                </div>
                <Esqueleto className="h-9 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-8">
          <EstadoError
            mensaje={error}
            onReintentar={() => setIntento((n) => n + 1)}
          />
        </div>
      ) : canchas.length === 0 ? (
        <div className="mt-8">
          <EstadoVacio
            titulo="No hay canchas para esta búsqueda"
            descripcion="Probá con otra disciplina o fecha. También podés volver a la disponibilidad de hoy."
            accion={
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                Limpiar filtros
              </button>
            }
            icono="buscar"
          />
        </div>
      ) : totalTurnos === 0 ? (
        <div className="mt-8">
          <EstadoVacio
            titulo="No hay turnos cargados para esta fecha"
            descripcion="Elegí otra fecha o volvé a la disponibilidad de hoy."
            accion={
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                Volver a hoy
              </button>
            }
            icono="calendario"
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {canchas.map((cancha) => {
            const franjas = franjasPorCancha[cancha.id] ?? [];
            const visibles = franjas.filter(
              (franja) =>
                horarioElegido === CUALQUIER_HORARIO ||
                horarioElegido === franja.hora,
            );
            const libres = visibles.filter((franja) => !franja.ocupada);
            const disciplinaPrincipal =
              cancha.disciplinas[0]?.nombre ?? "";
            return (
              <article
                key={cancha.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest transition hover:border-secondary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <Link
                  href={`/canchas/${cancha.id}`}
                  className="relative block"
                  aria-label={`Ver detalle de ${cancha.nombre}`}
                >
                  <ImagenDisciplina
                    disciplina={disciplinaPrincipal}
                    alt={`Cancha ${cancha.nombre}`}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="aspect-[16/7]"
                    imagenClassName="transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                    <Insignia tono="oscuro">
                      <Icono nombre="cancha" className="h-3.5 w-3.5" />
                      {etiquetaDisciplinas(cancha)}
                    </Insignia>
                    <Insignia
                      tono={cancha.estado === "DISPONIBLE" ? "verde" : "amarillo"}
                    >
                      {etiquetaEstadoCancha(cancha.estado)}
                    </Insignia>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold tracking-tight text-primary">
                        <Link
                          href={`/canchas/${cancha.id}`}
                          className="hover:text-secondary"
                        >
                          {cancha.nombre}
                        </Link>
                      </h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
                        <Icono
                          nombre="ubicacion"
                          className="h-4 w-4 text-secondary"
                        />
                        {cancha.ubicacion}
                      </p>
                    </div>
                    <Insignia>
                      <Icono nombre="usuarios" className="h-3.5 w-3.5" />
                      Capacidad {cancha.capacidad}
                    </Insignia>
                  </div>

                  <div className="mt-4 flex-1">
                    <p className="text-xs font-semibold text-on-surface-variant">
                      Próximos turnos libres
                    </p>
                    {libres.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {libres.slice(0, MAX_CHIPS).map((franja) => (
                          <Link
                            key={franja.id}
                            href={`/canchas/${cancha.id}/reservar?fecha=${fechaAplicada}&hora=${franja.hora}&turnoId=${franja.id}`}
                            className="rounded-full border border-secondary/25 bg-secondary-soft px-3.5 py-1.5 text-sm font-semibold text-secondary transition hover:border-secondary/40 hover:bg-secondary-container/50"
                          >
                            {franja.hora}
                          </Link>
                        ))}
                        {libres.length > MAX_CHIPS ? (
                          <Link
                            href={`/canchas/${cancha.id}`}
                            className="rounded-full border border-outline-variant/50 px-3.5 py-1.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
                          >
                            +{libres.length - MAX_CHIPS}
                          </Link>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 rounded-xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
                        Sin turnos libres a esta hora. Mirá el detalle completo.
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-4">
                    <Link
                      href={`/canchas/${cancha.id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-secondary/80"
                    >
                      Ver detalle y todos los turnos
                      <Icono nombre="flecha" className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
