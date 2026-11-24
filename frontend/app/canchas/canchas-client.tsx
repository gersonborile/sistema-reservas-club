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
  generarDiasCalendario,
  obtenerFechaLocalHoy,
} from "@/lib/fechas";

const CUALQUIER_HORARIO = "Cualquiera";
const MAX_CHIPS = 8;

const ESTILO_CONTROL =
  "w-full rounded-full border border-outline-variant/70 bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10";

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

  const dias = generarDiasCalendario(obtenerFechaLocalHoy(), 7);
  const nombresDisciplinas = disciplinas.map((d) => d.nombre);
  const opcionesDisciplina =
    disciplinaEnEdicion !== "Todas" &&
    !nombresDisciplinas.includes(disciplinaEnEdicion)
      ? [disciplinaEnEdicion, ...nombresDisciplinas]
      : nombresDisciplinas;
  const cambiosPendientes =
    disciplinaEnEdicion !== disciplinaAplicada ||
    fechaEnEdicion !== fechaAplicada;

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
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-secondary">
            <span className="pulso-disponible h-2 w-2 rounded-full bg-accent" />
            Disponibilidad
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
            Canchas y turnos
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
            Elegí disciplina, fecha y horario. Los turnos verdes se pueden
            reservar; el detalle muestra la grilla completa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Insignia tono="neutro">
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

      <div className="sticky top-[5.1rem] z-30 -mx-1 mt-8 px-1">
        <div className="rounded-[1.5rem] border border-outline-variant/70 bg-surface-container-lowest/95 p-4 shadow-[0_20px_50px_-38px_rgba(16,25,17,0.5)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-medium text-on-surface-variant">
                Disciplina
              </span>
              <div
                className="flex gap-1.5 overflow-x-auto pb-0.5 sin-scrollbar"
                role="group"
                aria-label="Filtrar por disciplina"
              >
                <BotonPildora
                  activo={disciplinaEnEdicion === "Todas"}
                  onClick={() => setDisciplinaEnEdicion("Todas")}
                >
                  Todas
                </BotonPildora>
                {opcionesDisciplina.map((nombre) => (
                  <BotonPildora
                    key={nombre}
                    activo={disciplinaEnEdicion === nombre}
                    onClick={() => setDisciplinaEnEdicion(nombre)}
                  >
                    {aEtiquetaDisciplina(nombre)}
                  </BotonPildora>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-on-surface-variant">
                    Fecha
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                    <Icono nombre="calendario" className="h-3.5 w-3.5" />
                    <span className="sr-only">Elegir otra fecha</span>
                    <input
                      type="date"
                      value={fechaEnEdicion}
                      onChange={(e) => setFechaEnEdicion(e.target.value)}
                      className="w-[7.5rem] rounded-lg border border-outline-variant/70 bg-surface-container-low px-2 py-1 text-xs font-medium text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                    />
                  </label>
                </div>
                <div
                  className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 sin-scrollbar"
                  role="group"
                  aria-label="Selector de fecha"
                >
                  {dias.map((dia) => {
                    const activo = dia.fecha === fechaEnEdicion;
                    const relativo =
                      dia.etiqueta === "Hoy" || dia.etiqueta === "Mañana"
                        ? dia.etiqueta
                        : dia.dia;
                    return (
                      <button
                        key={dia.fecha}
                        type="button"
                        onClick={() => setFechaEnEdicion(dia.fecha)}
                        aria-pressed={activo}
                        aria-label={`${dia.etiqueta} ${dia.numero}`}
                        className={`flex min-w-[3.8rem] flex-col items-center rounded-xl border px-2 py-2.5 text-center transition ${
                          activo
                            ? "border-primary bg-primary text-white"
                            : "border-outline-variant/60 bg-surface-container-low text-on-surface hover:border-secondary/40"
                        }`}
                      >
                        <span
                          className={`text-[0.6rem] font-medium ${
                            activo ? "text-white/60" : "text-on-surface-variant"
                          }`}
                        >
                          {relativo}
                        </span>
                        <span className="font-display text-2xl leading-none">
                          {dia.numero}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-on-surface-variant">
                    Franja horaria
                  </span>
                  <select
                    aria-label="Filtrar por franja horaria"
                    value={horarioElegido}
                    onChange={(e) => setHorario(e.target.value)}
                    className={`${ESTILO_CONTROL} mt-2 sm:w-44`}
                  >
                    {[CUALQUIER_HORARIO, ...horarios].map((h) => (
                      <option key={h} value={h}>
                        {h === CUALQUIER_HORARIO ? "Cualquier horario" : h}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={aplicarFiltros}
                  disabled={!cambiosPendientes}
                  className="inline-flex h-[2.75rem] items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
                >
                  <Icono nombre="buscar" className="h-4 w-4" />
                  {cambiosPendientes ? "Ver turnos" : "Filtros aplicados"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/50 pt-3">
              <p
                className="text-xs font-medium text-on-surface-variant"
                aria-live="polite"
              >
                {!cargando && !error
                  ? `${canchas.length} canchas · ${totalLibres} de ${totalTurnos} turnos libres`
                  : "Buscando disponibilidad…"}
              </p>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs font-medium text-secondary underline-offset-4 transition hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-[1.75rem] border border-outline-variant/50 bg-surface-container-lowest"
            >
              <Esqueleto className="aspect-[16/9] rounded-none" />
              <div className="space-y-3 p-5">
                <Esqueleto className="h-5 w-36" />
                <Esqueleto className="h-10 w-full" />
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
                className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary"
              >
                Ver disponibilidad de hoy
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
                className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary"
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
            const disciplinaPrincipal = cancha.disciplinas[0]?.nombre ?? "";
            return (
              <article
                key={cancha.id}
                className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-outline-variant/60 bg-surface-container-lowest transition hover:border-secondary/35"
              >
                <div className="relative">
                  <Link
                    href={`/canchas/${cancha.id}`}
                    aria-label={`Ver detalle de ${cancha.nombre}`}
                    className="block"
                  >
                    <ImagenDisciplina
                      disciplina={disciplinaPrincipal}
                      alt={`Cancha ${cancha.nombre}`}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="aspect-[16/9] w-full"
                      imagenClassName="transition duration-700 group-hover:scale-[1.03]"
                    />
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,25,17,0.02)_30%,rgba(16,25,17,0.8)_100%)]" />
                    <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                        {etiquetaDisciplinas(cancha)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          cancha.estado === "DISPONIBLE"
                            ? "bg-secondary-container text-primary"
                            : "bg-warning-container text-on-warning-container"
                        }`}
                      >
                        {etiquetaEstadoCancha(cancha.estado)}
                      </span>
                    </div>
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
                      <div className="min-w-0">
                        <h2 className="truncate font-display text-3xl leading-tight">
                          {cancha.nombre}
                        </h2>
                        <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs font-medium text-white/60">
                          <Icono
                            nombre="ubicacion"
                            className="h-3.5 w-3.5 flex-shrink-0"
                          />
                          {cancha.ubicacion} · {cancha.capacidad} personas
                        </p>
                      </div>
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm">
                        <Icono nombre="flecha" className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-on-surface-variant">
                      Turnos de 1 hora
                    </p>
                    <span
                      className={`text-xs font-semibold ${
                        libres.length > 0 ? "text-secondary" : "text-outline"
                      }`}
                    >
                      {libres.length} libres
                    </span>
                  </div>

                  {visibles.length > 0 ? (
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {visibles.slice(0, MAX_CHIPS).map((franja) =>
                        franja.ocupada ? (
                          <span
                            key={franja.id}
                            title="Turno ocupado"
                            className="cursor-not-allowed rounded-full border border-outline-variant/50 bg-surface-container px-1 py-2 text-center text-xs font-medium text-outline line-through"
                          >
                            {franja.hora.slice(0, 5)}
                          </span>
                        ) : (
                          <Link
                            key={franja.id}
                            href={`/canchas/${cancha.id}/reservar?fecha=${fechaAplicada}&hora=${franja.hora}&turnoId=${franja.id}`}
                            className="rounded-full border border-outline-variant/80 bg-surface-container-low px-1 py-2 text-center text-xs font-semibold text-secondary transition hover:border-primary hover:bg-primary hover:text-white"
                          >
                            {franja.hora.slice(0, 5)}
                          </Link>
                        ),
                      )}
                      {visibles.length > MAX_CHIPS ? (
                        <Link
                          href={`/canchas/${cancha.id}`}
                          className="flex items-center justify-center rounded-full border border-outline-variant/70 px-1 py-2 text-center text-xs font-semibold text-on-surface-variant transition hover:border-secondary/40 hover:text-secondary"
                        >
                          +{visibles.length - MAX_CHIPS}
                        </Link>
                      ) : null}
                    </div>
                  ) : null}

                  {libres.length === 0 ? (
                    <p className="mt-3 rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                      Sin turnos libres en esta franja. Mirá el detalle completo.
                    </p>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant/50 pt-4">
                    <Link
                      href={`/canchas/${cancha.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant transition hover:text-secondary"
                    >
                      Ver todos los turnos
                      <Icono nombre="flecha" className="h-3.5 w-3.5" />
                    </Link>
                    {libres.length > 0 ? (
                      <Link
                        href={`/canchas/${cancha.id}/reservar?fecha=${fechaAplicada}&hora=${libres[0].hora}&turnoId=${libres[0].id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-secondary"
                      >
                        Reservar
                        <Icono nombre="flecha" className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href={`/canchas/${cancha.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-4 py-2 text-xs font-medium text-on-surface-variant transition hover:border-secondary/40 hover:text-secondary"
                      >
                        Ver horarios
                      </Link>
                    )}
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

function BotonPildora({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        activo
          ? "border-primary bg-primary text-white"
          : "border-outline-variant/70 bg-surface-container-low text-on-surface-variant hover:border-secondary/40 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
