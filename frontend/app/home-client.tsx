"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import FooterHome from "./componentes/home/footer-home";
import NavbarHome from "./componentes/home/navbar-home";
import { EstadoError, EstadoVacio } from "@/app/componentes/ui/estado";
import {
  Icono,
  deporteDeDisciplina,
} from "@/app/componentes/ui/iconos";
import { Insignia } from "@/app/componentes/ui/insignia";
import ImagenDisciplina from "@/app/componentes/ui/imagen-disciplina";
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
  obtenerHoraLocalAhora,
} from "@/lib/fechas";
import { formatearMoneda } from "@/lib/formato";
import { IMAGEN_HERO } from "@/lib/imagenes";

type DatosHome = {
  disciplinas: DisciplinaApi[];
  reservas: ReservaUI[];
  canchas: CanchaUI[];
  turnos: TurnoApi[];
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
        const [disciplinas, reservasApi, canchasApi, turnos] = await Promise.all([
          obtenerDisciplinas(),
          obtenerMisReservas(),
          obtenerCanchas(),
          obtenerTurnosDeFecha(obtenerFechaLocalHoy()),
        ]);
        if (cancelado) return;
        setDatos({
          disciplinas,
          reservas: aReservasUI(reservasApi),
          canchas: canchasApi.map(aCanchaUI),
          turnos,
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
        <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
          <EstadoError
            mensaje={error}
            onReintentar={() => setIntento((n) => n + 1)}
          />
        </main>
      </div>
    );
  }

  if (!datos) return null;

  const misReservas = datos.reservas.filter(
    (reserva) => reserva.usuarioId === usuario.id,
  );
  const proxima = obtenerProximaReserva(misReservas, new Date());
  const turnosDelDia = turnosLibresDesde(datos.turnos, obtenerHoraLocalAhora());
  const turnosPorCancha = agruparTurnosPorCancha(turnosDelDia);
  const conteoPorDisciplina = contarTurnosLibresPorDisciplina(turnosDelDia);
  const hayTurnos = turnosDelDia.length > 0;
  const canchasReservables = datos.canchas.filter((cancha) => cancha.reservable);
  const disciplinasConLugar = datos.disciplinas.filter(
    (disciplina) => (conteoPorDisciplina[disciplina.id] ?? 0) > 0,
  ).length;

  const canchasConTurnos = canchasReservables
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
    .slice(0, 6);

  function disciplinaDeCancha(canchaId: string): string {
    const cancha = datos?.canchas.find((item) => item.id === canchaId);
    return cancha?.disciplinas[0]?.nombre ?? "";
  }

  function turnosDeCancha(canchaId: string): TurnoApi[] {
    return (turnosPorCancha[canchaId] ?? []).filter((turno) => turno.disponible);
  }

  return (
    <div className="min-h-screen bg-surface pb-[4.75rem] text-on-surface lg:pb-0">
      <NavbarHome usuario={usuario} />

      <main>
        <section className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-8 sm:pt-10">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary text-white">
            <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
              <div className="relative z-10 p-6 sm:p-10 lg:p-14">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75">
                    <span className="pulso-disponible h-1.5 w-1.5 rounded-full bg-secondary-container" />
                    {usuario.rol === "administrador" ? "Administrador" : "Socio"}
                  </span>
                  <span className="text-xs font-medium text-white/40">
                    {diaSemana(hoy)} {formatearFecha(hoy)}
                  </span>
                </div>

                <h1 className="mt-7 max-w-2xl font-display text-5xl leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Hola, {usuario.nombre.split(" ")[0]}.
                  <em className="mt-1 block italic text-secondary-container">
                    ¿Jugamos?
                  </em>
                </h1>
                <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
                  Tu próximo turno y las canchas con lugar hoy, en un solo
                  lugar. Elegí, reservá y seguí con tu día.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/canchas"
                    className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-6 py-3 text-sm font-semibold text-primary transition hover:bg-white"
                  >
                    Reservar cancha
                    <Icono nombre="flecha" className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/reservas"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Ver mis reservas
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[21rem] lg:min-h-full">
                <Image
                  src={IMAGEN_HERO}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover opacity-90"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,25,17,0.08)_18%,rgba(16,25,17,0.88)_100%)]"
                />
                <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-primary/30 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
                    <span className="pulso-disponible h-1.5 w-1.5 rounded-full bg-secondary-container" />
                    Hoy en el club
                  </span>
                  <span className="rounded-full bg-secondary-container px-3 py-1.5 text-xs font-semibold text-primary">
                    {turnosDelDia.length} turnos libres
                  </span>
                </div>
                <dl className="absolute inset-x-5 bottom-5 grid grid-cols-3 divide-x divide-white/15 rounded-2xl border border-white/15 bg-primary/35 py-3 backdrop-blur-md">
                  <MetricaOscura
                    valor={turnosDelDia.length}
                    etiqueta="Turnos"
                    sufijo="hoy"
                  />
                  <MetricaOscura
                    valor={disciplinasConLugar}
                    etiqueta="Disciplinas"
                    sufijo="con lugar"
                  />
                  <MetricaOscura
                    valor={canchasReservables.length}
                    etiqueta="Canchas"
                    sufijo="online"
                  />
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                <Icono nombre="ticket" className="h-4 w-4" />
                Tu próxima reserva
              </p>
              <h2 className="mt-4 max-w-lg font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
                Todo listo para{" "}
                <em className="italic text-secondary">volver a jugar.</em>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-on-surface-variant sm:text-base">
                Revisá tu próximo turno, el equipamiento reservado y lo que
                queda libre hoy en el club.
              </p>

              <dl className="mt-9 divide-y divide-outline-variant/60 border-y border-outline-variant/60">
                <DatoClub
                  valor={turnosDelDia.length}
                  etiqueta="Turnos libres hoy"
                  detalle="Disponibles para reservar ahora"
                />
                <DatoClub
                  valor={disciplinasConLugar}
                  etiqueta="Disciplinas con lugar"
                  detalle="Fútbol, pádel y tenis"
                />
                <DatoClub
                  valor={canchasReservables.length}
                  etiqueta="Canchas online"
                  detalle="Listas para recibir tu reserva"
                />
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/canchas"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary"
                >
                  Reservar turno
                  <Icono nombre="flecha" className="h-4 w-4" />
                </Link>
                <Link
                  href="/reservas"
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
                >
                  Gestionar reservas
                </Link>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-end justify-between gap-3">
                <p className="text-sm font-medium text-on-surface-variant">
                  El detalle de tu turno
                </p>
                <Link
                  href="/reservas"
                  className="text-sm font-medium text-secondary underline-offset-4 hover:underline"
                >
                  Ver todas
                </Link>
              </div>

              {proxima ? (
                <article className="tarjeta-elevada relative overflow-hidden rounded-[1.75rem]">
                  <div className="grid sm:grid-cols-[13rem_minmax(0,1fr)]">
                    <div className="relative flex flex-col justify-between gap-8 bg-primary p-6 text-white">
                      <span
                        aria-hidden="true"
                        className="muesca-boleto -right-[0.55rem] top-6"
                      />
                      <span
                        aria-hidden="true"
                        className="muesca-boleto -right-[0.55rem] bottom-6"
                      />

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-white/45">
                          Turno confirmado
                        </span>
                        <Insignia tono="verde">
                          <Icono nombre="check" className="h-3.5 w-3.5" />
                          Confirmada
                        </Insignia>
                      </div>

                      <div>
                        <p className="font-display text-6xl leading-[0.8] text-white">
                          {proxima.hora}
                        </p>
                        <p className="mt-2 text-sm font-medium text-secondary-container">
                          hasta {proxima.horaFin} hs
                        </p>
                        <p className="mt-5 text-xs font-medium capitalize text-white/55">
                          {diaSemana(proxima.fecha)}{" "}
                          {formatearFecha(proxima.fecha)} ·{" "}
                          {etiquetaFechaRelativa(proxima.fecha, hoy)}
                        </p>
                      </div>

                      <p className="text-[0.7rem] font-medium tracking-[0.12em] text-white/40">
                        #{proxima.id.slice(0, 6).toUpperCase()}
                      </p>
                    </div>

                    <div className="flex flex-col p-6">
                      <div className="flex items-start gap-3">
                        <ImagenDisciplina
                          disciplina={disciplinaDeCancha(proxima.canchaId)}
                          alt={`Cancha de ${proxima.canchaNombre}`}
                          className="h-14 w-14 flex-shrink-0 rounded-full"
                          sizes="56px"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-xs font-medium text-secondary">
                            <Icono nombre="cancha" className="h-3.5 w-3.5" />
                            {aEtiquetaDisciplina(
                              disciplinaDeCancha(proxima.canchaId),
                            ) || "Cancha"}
                          </p>
                          <h3 className="mt-1 truncate font-display text-3xl leading-tight text-primary">
                            {proxima.canchaNombre}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <DatoRapido
                          icono="calendario"
                          etiqueta="Fecha"
                          valor={formatearFecha(proxima.fecha)}
                        />
                        <DatoRapido
                          icono="reloj"
                          etiqueta="Duración"
                          valor="1 hora"
                        />
                      </div>

                      {proxima.alquiler ? (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-secondary/15 bg-secondary-soft px-3.5 py-3">
                          <span className="flex items-center gap-2 text-xs font-medium text-secondary">
                            <Icono nombre="equipamiento" className="h-4 w-4" />
                            Equipamiento alquilado
                          </span>
                          <span className="text-sm font-semibold text-secondary">
                            {formatearMoneda(proxima.alquiler.total)}
                          </span>
                        </div>
                      ) : null}

                      <Link
                        href="/reservas"
                        className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-sm font-semibold text-primary transition hover:text-secondary"
                      >
                        Gestionar turno
                        <Icono nombre="flecha" className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ) : (
                <EstadoVacio
                  titulo="Todavía no tenés una reserva próxima"
                  descripcion="Elegí una cancha con turno libre hoy y armá tu próximo partido en minutos."
                  accion={
                    <Link
                      href="/canchas"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary"
                    >
                      Explorar canchas
                      <Icono nombre="flecha" className="h-4 w-4" />
                    </Link>
                  }
                  icono="calendario"
                />
              )}
            </div>
          </div>
        </section>

        <section className="border-y border-outline-variant/50 bg-surface-container-low">
          <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8 sm:py-24">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                  <Icono nombre="cancha" className="h-4 w-4" />
                  Disciplinas
                </p>
                <h2 className="mt-3 max-w-xl font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
                  Elegí cómo <em className="italic text-secondary">querés jugar.</em>
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
                  Cada disciplina muestra los turnos libres de hoy. Entrá y
                  reservá el horario que mejor te queda.
                </p>
              </div>
              <Link
                href="/canchas"
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-secondary underline-offset-4 hover:underline"
              >
                Ver todas las canchas
                <Icono nombre="flecha" className="h-4 w-4" />
              </Link>
            </div>

            {datos.disciplinas.length === 0 ? (
              <div className="mt-10">
                <EstadoVacio
                  titulo="No hay disciplinas cargadas"
                  descripcion="Cuando el club publique sus disciplinas, vas a poder reservar desde acá."
                  accion={
                    <Link
                      href="/canchas"
                      className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Ver disponibilidad
                    </Link>
                  }
                  icono="cancha"
                />
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {datos.disciplinas.slice(0, 3).map((disciplina) => {
                  const libres = conteoPorDisciplina[disciplina.id] ?? 0;
                  const deporte = deporteDeDisciplina(disciplina.nombre);
                  return (
                    <Link
                      key={disciplina.id}
                      href={`/canchas?disciplina=${encodeURIComponent(disciplina.nombre)}`}
                      className="group relative overflow-hidden rounded-[1.75rem] bg-primary"
                    >
                      <ImagenDisciplina
                        disciplina={disciplina.nombre}
                        alt={`Cancha de ${aEtiquetaDisciplina(disciplina.nombre)}`}
                        className="aspect-[4/5] w-full"
                        imagenClassName="transition duration-700 group-hover:scale-[1.04]"
                        sizes="(min-width: 1024px) 33vw, 100vw"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,25,17,0.08)_25%,rgba(16,25,17,0.9)_100%)]"
                      />

                      <div className="absolute inset-0 flex flex-col justify-between p-5 text-white sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                            {libres > 0
                              ? `${libres} turnos libres hoy`
                              : "Sin turnos libres hoy"}
                          </span>
                          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
                            <Icono
                              nombre={deporte === "generico" ? "cancha" : deporte}
                              className="h-4 w-4"
                            />
                          </span>
                        </div>

                        <div>
                          <h3 className="font-display text-4xl leading-tight">
                            {aEtiquetaDisciplina(disciplina.nombre)}
                          </h3>
                          <p className="mt-2 text-sm text-white/55">
                            Turnos de 1 hora · Todos los días
                          </p>
                          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-secondary-container">
                            Reservar
                            <Icono nombre="flecha" className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                <span className="pulso-disponible h-2 w-2 rounded-full bg-accent" />
                Hoy
              </p>
              <h2 className="mt-3 max-w-xl font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
                Canchas con <em className="italic text-secondary">lugar hoy.</em>
              </h2>
              <p className="mt-4 text-sm text-on-surface-variant sm:text-base">
                {hayTurnos
                  ? `${turnosDelDia.length} turnos disponibles para reservar hoy`
                  : "Todavía no hay turnos libres para hoy"}
              </p>
            </div>

            <div
              className="flex gap-1 overflow-x-auto rounded-full border border-outline-variant/70 bg-surface-container-lowest p-1 sin-scrollbar"
              role="group"
              aria-label="Filtrar canchas por disciplina"
            >
              <BotonFiltro
                activo={filtro === "Todas"}
                onClick={() => setFiltro("Todas")}
              >
                Todas
              </BotonFiltro>
              {datos.disciplinas.map((disciplina) => (
                <BotonFiltro
                  key={disciplina.id}
                  activo={filtro === disciplina.id}
                  onClick={() => setFiltro(disciplina.id)}
                >
                  {aEtiquetaDisciplina(disciplina.nombre)}
                </BotonFiltro>
              ))}
            </div>
          </div>

          {canchasConTurnos.length === 0 ? (
            <div className="mt-9">
              <EstadoVacio
                titulo={
                  hayTurnos
                    ? "No hay canchas para este filtro"
                    : "No hay turnos libres hoy"
                }
                descripcion={
                  hayTurnos
                    ? "Probá con otra disciplina o mirá todas las canchas."
                    : "Mirá las próximas fechas en el listado de canchas."
                }
                accion={
                  <Link
                    href="/canchas"
                    className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary"
                  >
                    Ver canchas y fechas
                  </Link>
                }
                icono="cancha"
              />
            </div>
          ) : (
            <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {canchasConTurnos.map(({ cancha, turno }) => {
                const slots = turnosDeCancha(cancha.id);
                return (
                  <article
                    key={cancha.id}
                    className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-outline-variant/60 bg-surface-container-lowest transition hover:border-secondary/35"
                  >
                    <div className="relative">
                      <ImagenDisciplina
                        disciplina={cancha.disciplinas[0]?.nombre ?? ""}
                        alt={`Cancha de ${cancha.nombre}`}
                        className="aspect-[16/10] w-full"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        imagenClassName="transition duration-700 group-hover:scale-[1.03]"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,25,17,0.02)_30%,rgba(16,25,17,0.8)_100%)]"
                      />
                      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                          {etiquetaDisciplinas(cancha)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1.5 text-xs font-semibold text-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Hoy
                        </span>
                      </div>
                      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-3xl leading-tight">
                            {cancha.nombre}
                          </h3>
                          <p className="mt-1.5 truncate text-xs font-medium text-white/60">
                            {cancha.ubicacion} · {cancha.capacidad} personas
                          </p>
                        </div>
                        <Link
                          href={`/canchas/${cancha.id}`}
                          aria-label={`Ver detalle de ${cancha.nombre}`}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                        >
                          <Icono nombre="informacion" className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-on-surface-variant">
                          Próximos turnos libres
                        </p>
                        <span className="text-xs font-semibold text-secondary">
                          {slots.length} disponibles
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {slots.slice(0, 3).map((slot) => (
                          <Link
                            key={slot.id}
                            href={`/canchas/${cancha.id}/reservar?fecha=${hoy}&hora=${slot.hora_inicio.slice(0, 5)}&turnoId=${slot.id}`}
                            className="rounded-full border border-outline-variant/80 bg-surface-container-low px-1 py-2 text-center text-xs font-semibold text-secondary transition hover:border-primary hover:bg-primary hover:text-white"
                          >
                            {slot.hora_inicio.slice(0, 5)}
                          </Link>
                        ))}
                      </div>

                      <div className="mt-auto flex items-center gap-2 pt-5">
                        <Link
                          href={`/canchas/${cancha.id}/reservar?fecha=${hoy}&hora=${turno.hora_inicio.slice(0, 5)}&turnoId=${turno.id}`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-secondary"
                        >
                          Reservar turno
                          <Icono nombre="flecha" className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/canchas/${cancha.id}`}
                          className="rounded-full border border-outline-variant px-3 py-2.5 text-xs font-medium text-on-surface-variant transition hover:border-secondary/40 hover:text-secondary"
                        >
                          Ver más
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <FooterHome disciplinas={datos.disciplinas} />
    </div>
  );
}

function MetricaOscura({
  valor,
  etiqueta,
  sufijo,
}: {
  valor: number;
  etiqueta: string;
  sufijo: string;
}) {
  return (
    <div className="px-3 text-center first:pl-4 last:pr-4">
      <dt className="text-[0.6rem] font-medium leading-tight text-white/45">
        {etiqueta}
      </dt>
      <dd className="mt-1 font-display text-3xl leading-none text-secondary-container">
        {valor}
        <span className="ml-1 font-sans text-[0.55rem] font-medium text-white/40">
          {sufijo}
        </span>
      </dd>
    </div>
  );
}

function DatoClub({
  valor,
  etiqueta,
  detalle,
}: {
  valor: number;
  etiqueta: string;
  detalle: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4">
      <div>
        <dt className="text-sm font-medium text-on-surface">{etiqueta}</dt>
        <dd className="mt-0.5 text-xs text-on-surface-variant">{detalle}</dd>
      </div>
      <span className="font-display text-4xl leading-none text-primary">
        {valor}
      </span>
    </div>
  );
}

function DatoRapido({
  icono,
  etiqueta,
  valor,
}: {
  icono: "calendario" | "reloj";
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-on-surface-variant">
        <Icono nombre={icono} className="h-3.5 w-3.5 text-secondary" />
        {etiqueta}
      </span>
      <p className="mt-1 truncate text-sm font-semibold text-primary">{valor}</p>
    </div>
  );
}

function BotonFiltro({
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
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
        activo
          ? "bg-primary text-white"
          : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function HomeCargando({ nombre }: { nombre: string }) {
  return (
    <div className="min-h-screen bg-surface pb-[4.75rem] text-on-surface lg:pb-0">
      <NavbarHome usuario={null} />
      <main className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-8 sm:pt-10">
        <div className="h-[26rem] animate-pulse rounded-[2rem] bg-surface-container" />
        <p className="sr-only">Cargando la home de {nombre}</p>
        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
            <div className="h-24 w-full animate-pulse rounded bg-surface-container" />
            <div className="h-32 w-full animate-pulse rounded bg-surface-container" />
          </div>
          <div className="h-64 animate-pulse rounded-3xl bg-surface-container" />
        </div>
        <div className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-[1.75rem] bg-surface-container"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
