"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import FooterHome from "./componentes/home/footer-home";
import NavbarHome from "./componentes/home/navbar-home";
import type { DisciplinaApi, TurnoApi } from "@/lib/api";
import {
  mensajeDeError,
  obtenerCanchas,
  obtenerDisciplinas,
  obtenerMisReservas,
  obtenerTurnosDeFecha,
} from "@/lib/api";
import type { CanchaUI, ReservaUI } from "@/lib/adaptadores";
import {
  aCanchaUI,
  aEtiquetaDisciplina,
  agruparTurnosPorCancha,
  aReservasUI,
  contarTurnosLibresPorDisciplina,
  etiquetaDisciplinas,
  obtenerProximaReserva,
  proximoTurnoLibre,
  turnosLibresDesde,
} from "@/lib/adaptadores";
import type { UsuarioPublico } from "@/lib/tipos";
import {
  diaSemana,
  etiquetaFechaRelativa,
  formatearFecha,
  obtenerFechaLocalHoy,
  obtenerFechaLocalManana,
  obtenerHoraLocalAhora,
} from "@/lib/fechas";

type DatosHome = {
  disciplinas: DisciplinaApi[];
  reservas: ReservaUI[];
  canchas: CanchaUI[];
  turnos: TurnoApi[];
  fechaTurnos: string;
};

export default function HomeClient({ usuario }: { usuario: UsuarioPublico }) {
  const [datos, setDatos] = useState<DatosHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [filtro, setFiltro] = useState("Todas");

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      setError(null);
      try {
        const [disciplinas, reservasApi, canchasApi] = await Promise.all([
          obtenerDisciplinas(),
          obtenerMisReservas(),
          obtenerCanchas(),
        ]);
        const hoy = obtenerFechaLocalHoy();
        const hora = obtenerHoraLocalAhora();
        let fechaTurnos = hoy;
        let turnos = await obtenerTurnosDeFecha(hoy);
        if (turnosLibresDesde(turnos, hora).length === 0) {
          fechaTurnos = obtenerFechaLocalManana();
          turnos = await obtenerTurnosDeFecha(fechaTurnos);
        }
        if (cancelado) return;
        setDatos({
          disciplinas,
          reservas: aReservasUI(reservasApi),
          canchas: canchasApi.map(aCanchaUI).filter((cancha) => cancha.reservable),
          turnos,
          fechaTurnos,
        });
      } catch (e) {
        if (cancelado) return;
        setError(mensajeDeError(e));
      }
    }
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [intento]);

  const hoy = obtenerFechaLocalHoy();
  const cargando = datos === null && error === null;

  if (cargando) {
    return <HomeCargando nombre={usuario.nombre} />;
  }

  if (error && !datos) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <NavbarHome usuario={usuario} />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div
            role="alert"
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6"
          >
            <p className="text-sm text-on-surface">{error}</p>
            <button
              type="button"
              onClick={() => setIntento((n) => n + 1)}
              className="mt-4 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary/90"
            >
              Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!datos) return null;

  const misReservas = datos.reservas.filter(
    (reserva) => reserva.usuarioId === usuario.id,
  );
  const proxima = obtenerProximaReserva(misReservas, new Date());
  const turnosLibres = datos.turnos.filter((turno) => turno.disponible);
  const turnosDelDia =
    datos.fechaTurnos === hoy
      ? turnosLibresDesde(turnosLibres, obtenerHoraLocalAhora())
      : turnosLibres;
  const turnosPorCancha = agruparTurnosPorCancha(datos.turnos);
  const conteoPorDisciplina = contarTurnosLibresPorDisciplina(turnosDelDia);
  const fechaTexto = etiquetaFechaRelativa(datos.fechaTurnos, hoy);
  const hayTurnos = turnosDelDia.length > 0;

  const canchasConTurnos = datos.canchas
    .map((cancha) => ({
      cancha,
      turno: proximoTurnoLibre(turnosPorCancha[cancha.id] ?? []),
    }))
    .filter(
      (item): item is { cancha: CanchaUI; turno: TurnoApi } =>
        item.turno !== null &&
        (filtro === "Todas" ||
          item.cancha.disciplinas.some((d) => d.id === filtro)),
    )
    .sort((a, b) => a.cancha.nombre.localeCompare(b.cancha.nombre))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <NavbarHome usuario={usuario} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              {usuario.rol === "administrador" ? "Administrador" : "Socio"}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              Hola, {usuario.nombre}
            </h1>
            <p className="mt-2 max-w-xl text-on-surface-variant">
              Gestioná tus turnos, explorá canchas disponibles y reservá en
              segundos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/reservas"
              className="rounded-full border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container"
            >
              Ver mis reservas
            </Link>
            <Link
              href="/canchas"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Reservar una cancha
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Próxima reserva
            </h2>
            {proxima ? (
              <div className="relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-secondary/10" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center rounded-full bg-secondary-container/40 px-2.5 py-1 text-xs font-semibold text-secondary">
                      {etiquetaFechaRelativa(proxima.fecha, hoy)} · Confirmada
                    </div>
                    <h3 className="text-xl font-bold text-primary">
                      {proxima.canchaNombre}
                    </h3>
                    <p className="mt-1 text-2xl font-extrabold text-secondary">
                      {proxima.hora} - {proxima.horaFin} hs
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-on-surface-variant sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-on-surface">Fecha:</span>{" "}
                        {diaSemana(proxima.fecha)} {formatearFecha(proxima.fecha)}
                      </p>
                      <p>
                        <span className="font-medium text-on-surface">Estado:</span>{" "}
                        Confirmada
                      </p>
                      {proxima.alquiler ? (
                        <p>
                          <span className="font-medium text-on-surface">
                            Equipamiento:
                          </span>{" "}
                          ${proxima.alquiler.total.toLocaleString("es-AR")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex min-w-[160px] flex-col gap-2">
                    <Link
                      href="/reservas"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        calendar_month
                      </span>
                      Gestionar turno
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low p-10 text-center">
                <span className="material-symbols-outlined mb-3 text-[40px] text-outline">
                  event_busy
                </span>
                <h3 className="text-lg font-semibold text-primary">
                  No tenés reservas próximas
                </h3>
                <p className="mt-1 max-w-sm text-sm text-on-surface-variant">
                  Explorá las canchas disponibles y reservá tu próximo turno en
                  segundos.
                </p>
                <Link
                  href="/canchas"
                  className="mt-5 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary/90"
                >
                  Explorar canchas
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Accesos rápidos
            </h2>
            <div className="space-y-3">
              {datos.disciplinas.map((disciplina) => {
                const libres = conteoPorDisciplina[disciplina.id] ?? 0;
                return (
                  <Link
                    key={disciplina.id}
                    href={`/canchas?disciplina=${encodeURIComponent(disciplina.nombre)}`}
                    className="group flex w-full items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-left transition hover:-translate-y-0.5 hover:border-secondary/30 hover:bg-surface hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition group-hover:bg-secondary group-hover:text-white">
                        <span className="material-symbols-outlined">sports</span>
                      </div>
                      <div>
                        <p className="font-semibold text-primary">
                          {aEtiquetaDisciplina(disciplina.nombre)}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {libres > 0
                            ? `${libres} turnos libres ${fechaTexto}`
                            : hayTurnos
                              ? `Sin turnos libres ${fechaTexto}`
                              : "Sin turnos cargados"}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline transition group-hover:text-secondary">
                      arrow_forward
                    </span>
                  </Link>
                );
              })}
              {datos.disciplinas.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-outline-variant/40 p-4 text-sm text-on-surface-variant">
                  No hay disciplinas cargadas.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
                </span>
                <h2 className="text-xl font-bold text-primary">
                  Canchas con turnos libres
                </h2>
              </div>
              <p className="text-sm text-on-surface-variant">
                Turnos cargados para {fechaTexto}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFiltro("Todas")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  filtro === "Todas"
                    ? "bg-secondary text-white"
                    : "border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                Todas
              </button>
              {datos.disciplinas.map((disciplina) => (
                <button
                  key={disciplina.id}
                  type="button"
                  onClick={() => setFiltro(disciplina.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    filtro === disciplina.id
                      ? "bg-secondary text-white"
                      : "border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {aEtiquetaDisciplina(disciplina.nombre)}
                </button>
              ))}
            </div>
          </div>

          {canchasConTurnos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low p-10 text-center">
              <span className="material-symbols-outlined mb-3 text-[40px] text-outline">
                event_busy
              </span>
              <h3 className="text-lg font-semibold text-primary">
                {hayTurnos
                  ? "No hay canchas para este filtro"
                  : "No hay turnos cargados para esta fecha"}
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Probá con otra disciplina o elegí una fecha en el listado de
                canchas.
              </p>
              <Link
                href="/canchas"
                className="mt-5 inline-block rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary/90"
              >
                Ver canchas y fechas
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {canchasConTurnos.map(({ cancha, turno }) => (
                <div
                  key={cancha.id}
                  className="flex flex-col rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 transition hover:border-secondary/30 hover:shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                        {etiquetaDisciplinas(cancha)}
                      </p>
                      <h3 className="text-lg font-bold text-primary">
                        {cancha.nombre}
                      </h3>
                    </div>
                    <span className="rounded-full bg-secondary-container/30 px-2.5 py-1 text-xs font-bold text-secondary">
                      {turno.hora_inicio.slice(0, 5)}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {cancha.ubicacion} · Capacidad {cancha.capacidad}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      schedule
                    </span>
                    {turno.hora_inicio.slice(0, 5)} - {turno.hora_fin.slice(0, 5)} hs
                  </div>
                  <Link
                    href={`/canchas/${cancha.id}/reservar?fecha=${datos.fechaTurnos}&hora=${turno.hora_inicio}&turnoId=${turno.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      bolt
                    </span>
                    Reservar turno
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <FooterHome disciplinas={datos.disciplinas} />
    </div>
  );
}

function HomeCargando({ nombre }: { nombre: string }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <NavbarHome usuario={null} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-10">
          <div className="h-6 w-32 animate-pulse rounded-full bg-surface-container" />
          <div className="mt-4 h-10 w-64 max-w-full animate-pulse rounded-lg bg-surface-container" />
          <p className="sr-only">Cargando la home de {nombre}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-56 animate-pulse rounded-2xl bg-surface-container lg:col-span-7" />
          <div className="space-y-3 lg:col-span-5">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-2xl bg-surface-container"
              />
            ))}
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-2xl bg-surface-container"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
