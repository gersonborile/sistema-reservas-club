"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import ImagenDisciplina from "@/app/componentes/ui/imagen-disciplina";
import { Icono } from "@/app/componentes/ui/iconos";
import { Insignia } from "@/app/componentes/ui/insignia";
import { Esqueleto } from "@/app/componentes/ui/esqueleto";
import { EstadoError, EstadoVacio } from "@/app/componentes/ui/estado";
import type {
  DisciplinaApi,
} from "@/lib/api";
import {
  mensajeDeError,
  obtenerCanchas,
  obtenerDisciplinas,
  obtenerEquipamiento,
} from "@/lib/api";
import type { CanchaUI, EquipamientoUI } from "@/lib/adaptadores";
import {
  aCanchaUI,
  aEquipamientoUI,
  aEtiquetaDisciplina,
  descripcionDisciplina,
  etiquetaDisciplinas,
  etiquetaEstadoCancha,
} from "@/lib/adaptadores";
import { APERTURA, CIERRE } from "@/lib/franjas";
import { formatearDuracion, formatearMoneda } from "@/lib/formato";
import { IMAGEN_HERO } from "@/lib/imagenes";

const PASOS = [
  {
    titulo: "Elegí cancha y turno",
    descripcion:
      "Mirá la disponibilidad por disciplina y seleccioná el día y la hora que prefieras.",
    icono: "calendario" as const,
  },
  {
    titulo: "Sumá equipamiento",
    descripcion:
      "Agregá lo que te falte para jugar y confirmá todo en la misma reserva.",
    icono: "equipamiento" as const,
  },
  {
    titulo: "Confirmá tu reserva",
    descripcion:
      "Listo: te queda el turno y lo podés ver cuando quieras en tus reservas.",
    icono: "check" as const,
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Cómo reservo un turno?",
    respuesta:
      "Elegí una disciplina, una fecha y un horario libre. Si todavía no tenés cuenta, te pedimos iniciar sesión antes de confirmar.",
  },
  {
    pregunta: "¿Puedo alquilar equipamiento?",
    respuesta:
      "Sí. Durante la confirmación vas a ver el equipamiento disponible para esa disciplina, con su stock y precio unitario.",
  },
  {
    pregunta: "¿Hasta cuándo puedo cancelar?",
    respuesta:
      "Podés cancelar desde Mis reservas hasta 2 horas antes del turno. La aplicación te muestra el resultado de la cancelación.",
  },
  {
    pregunta: "¿Necesito una cuenta?",
    respuesta:
      "Sí. La cuenta te permite reservar, alquilar equipamiento y gestionar o cancelar tus turnos.",
  },
  {
    pregunta: "¿Cuál es el horario del club?",
    respuesta: `Todos los días de ${APERTURA} a ${CIERRE} hs, con turnos de una hora.`,
  },
];

const LINKS_SECCION = [
  { texto: "Disciplinas", href: "#disciplinas" },
  { texto: "Canchas", href: "#canchas" },
  { texto: "Cómo funciona", href: "#como-funciona" },
  { texto: "Horarios", href: "#horarios" },
];

type Contenido = {
  disciplinas: DisciplinaApi[];
  canchas: CanchaUI[];
  equipamiento: EquipamientoUI[];
};

type Errores = {
  disciplinas: string | null;
  canchas: string | null;
  equipamiento: string | null;
};

export default function Landing() {
  const [contenido, setContenido] = useState<Contenido | null>(null);
  const [errores, setErrores] = useState<Errores>({
    disciplinas: null,
    canchas: null,
    equipamiento: null,
  });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      const [disciplinas, canchas, equipamiento] = await Promise.allSettled([
        obtenerDisciplinas(),
        obtenerCanchas(),
        obtenerEquipamiento({ disponible: true }),
      ]);
      if (cancelado) return;

      setContenido({
        disciplinas:
          disciplinas.status === "fulfilled" ? disciplinas.value : [],
        canchas:
          canchas.status === "fulfilled"
            ? canchas.value.map(aCanchaUI).filter((cancha) => cancha.reservable)
            : [],
        equipamiento:
          equipamiento.status === "fulfilled"
            ? equipamiento.value
                .map(aEquipamientoUI)
                .filter((item) => item.activo && item.stockDisponible > 0)
            : [],
      });
      setErrores({
        disciplinas:
          disciplinas.status === "rejected"
            ? mensajeDeError(disciplinas.reason)
            : null,
        canchas:
          canchas.status === "rejected" ? mensajeDeError(canchas.reason) : null,
        equipamiento:
          equipamiento.status === "rejected"
            ? mensajeDeError(equipamiento.reason)
            : null,
      });
    }
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [intento]);

  const cargando = contenido === null;
  const disciplinas = contenido?.disciplinas ?? [];
  const canchas = (contenido?.canchas ?? []).slice(0, 4);
  const equipamiento = (contenido?.equipamiento ?? []).slice(0, 4);
  const nombres = disciplinas
    .map((disciplina) => aEtiquetaDisciplina(disciplina.nombre))
    .join(" · ");

  function reintentar() {
    setContenido(null);
    setErrores({ disciplinas: null, canchas: null, equipamiento: null });
    setIntento((n) => n + 1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-secondary-container">
              CD
            </div>
            <span className="hidden truncate text-sm font-bold tracking-tight text-primary sm:inline">
              Club Deportivo
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {LINKS_SECCION.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-on-surface-variant transition hover:text-secondary"
              >
                {link.texto}
              </a>
            ))}
          </nav>

          <div className="flex flex-shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-outline-variant/50 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container-low sm:text-sm"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90 sm:px-4 sm:text-sm"
            >
              Registrate
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-outline-variant/30 bg-surface-container-lowest">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:py-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary-soft px-3 py-1.5 text-xs font-semibold text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Turnos reales, sin vueltas
              </p>
              <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-primary sm:text-5xl lg:text-6xl">
                Tu próximo partido empieza en el club.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-on-surface-variant sm:text-lg">
                Elegí disciplina, fecha y horario. Confirmá tu turno y sumá
                equipamiento en la misma reserva.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/canchas"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90"
                >
                  Ver disponibilidad
                  <Icono nombre="flecha" className="h-4 w-4" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
                >
                  Cómo funciona
                </a>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-on-surface-variant">
                <Icono nombre="reloj" className="h-4 w-4 text-secondary" />
                Todos los días de {APERTURA} a {CIERRE} hs
              </p>
            </div>

            <div className="relative">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-outline-variant/30 bg-surface-container shadow-xl shadow-primary/10 sm:aspect-[4/3]">
                <Image
                  src={IMAGEN_HERO}
                  alt="Cancha deportiva del club"
                  fill
                  priority
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,28,28,0.08)_20%,rgba(26,28,28,0.82)_100%)]" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-primary/65 px-4 py-3 text-white backdrop-blur-md sm:inset-x-5 sm:bottom-5">
                  <p className="text-xs font-semibold text-secondary-container">
                    Disciplinas del club
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cargando ? (
                      <span className="h-6 w-40 animate-pulse rounded-full bg-white/20" />
                    ) : disciplinas.length > 0 ? (
                      disciplinas.slice(0, 3).map((disciplina) => {
                        const duracion = formatearDuracion(
                          disciplina.duracionTipicaMinutos,
                        );
                        return (
                          <span
                            key={disciplina.id}
                            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold"
                          >
                            {aEtiquetaDisciplina(disciplina.nombre)}
                            {duracion ? ` · ${duracion}` : ""}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-white/70">
                        Consultá la disponibilidad del club.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute -left-3 top-5 hidden rotate-[-4deg] rounded-xl border border-secondary/20 bg-secondary-container px-3 py-2 text-xs font-bold text-primary shadow-md sm:block">
                {cargando
                  ? "Cargando canchas"
                  : canchas.length > 0
                    ? `${canchas.length} canchas para reservar`
                    : "Disponibilidad online"}
              </div>
            </div>
          </div>
        </section>

        <section
          id="disciplinas"
          className="scroll-mt-24 border-b border-outline-variant/30"
        >
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-secondary">
                  Disciplinas
                </p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-primary sm:text-4xl">
                  Elegí cómo querés jugar
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
                  {cargando
                    ? "Cargando las disciplinas del club."
                    : nombres || "Disciplinas cargadas por el club."}
                </p>
              </div>
              <Link
                href="/canchas"
                className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-secondary/80"
              >
                Ver todas las canchas
                <Icono nombre="flecha" className="h-4 w-4" />
              </Link>
            </div>

            {cargando ? (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest">
                    <Esqueleto className="aspect-[4/3] rounded-none" />
                    <div className="space-y-3 p-5">
                      <Esqueleto className="h-6 w-28" />
                      <Esqueleto className="h-4 w-full" />
                      <Esqueleto className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : errores.disciplinas ? (
              <div className="mt-8">
                <EstadoError
                  mensaje={errores.disciplinas}
                  onReintentar={reintentar}
                />
              </div>
            ) : disciplinas.length === 0 ? (
              <div className="mt-8">
                <EstadoVacio
                  titulo="Todavía no hay disciplinas cargadas"
                  descripcion="Cuando el club publique sus disciplinas, van a aparecer acá con su duración y reglas."
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
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {disciplinas.map((disciplina) => {
                  const duracion = formatearDuracion(
                    disciplina.duracionTipicaMinutos,
                  );
                  return (
                    <article
                      key={disciplina.id}
                      className="group overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest transition hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="relative">
                        <ImagenDisciplina
                          disciplina={disciplina.nombre}
                          alt={`Cancha de ${aEtiquetaDisciplina(disciplina.nombre)}`}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="aspect-[4/3]"
                          imagenClassName="transition duration-500 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                          <Insignia tono="oscuro">
                            {duracion ?? "Turnos por hora"}
                          </Insignia>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-bold tracking-tight text-primary">
                          {aEtiquetaDisciplina(disciplina.nombre)}
                        </h3>
                        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-on-surface-variant">
                          {disciplina.reglas?.trim() ||
                            descripcionDisciplina(disciplina)}
                        </p>
                        <Link
                          href={`/canchas?disciplina=${encodeURIComponent(disciplina.nombre)}`}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-secondary/80"
                        >
                          Ver canchas
                          <Icono nombre="flecha" className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section
          id="canchas"
          className="scroll-mt-24 border-b border-outline-variant/30 bg-surface-container-low"
        >
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-secondary">Canchas</p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-primary sm:text-4xl">
                  El club, listo para jugar
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
                  Estas son las canchas disponibles que devuelve el club.
                </p>
              </div>
              <Link
                href="/canchas"
                className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-secondary/80"
              >
                Buscar por fecha y horario
                <Icono nombre="flecha" className="h-4 w-4" />
              </Link>
            </div>

            {cargando ? (
              <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="grid overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest sm:grid-cols-[170px_1fr]">
                    <Esqueleto className="h-40 rounded-none sm:h-full" />
                    <div className="space-y-3 p-5">
                      <Esqueleto className="h-6 w-40" />
                      <Esqueleto className="h-4 w-32" />
                      <Esqueleto className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : errores.canchas ? (
              <div className="mt-8">
                <EstadoError
                  mensaje={errores.canchas}
                  onReintentar={reintentar}
                />
              </div>
            ) : canchas.length === 0 ? (
              <div className="mt-8">
                <EstadoVacio
                  titulo="No hay canchas disponibles"
                  descripcion="El club no tiene canchas disponibles en este momento. Podés revisar más tarde o consultar otra fecha."
                  accion={
                    <Link
                      href="/canchas"
                      className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Elegir fecha
                    </Link>
                  }
                  icono="cancha"
                />
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                {canchas.map((cancha) => {
                  const disciplinaPrincipal =
                    cancha.disciplinas[0]?.nombre ?? "";
                  return (
                    <article
                      key={cancha.id}
                      className="group grid overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest transition hover:border-secondary/30 hover:shadow-lg hover:shadow-primary/5 sm:grid-cols-[180px_1fr]"
                    >
                      <ImagenDisciplina
                        disciplina={disciplinaPrincipal}
                        alt={`Cancha ${cancha.nombre}`}
                        sizes="(min-width: 640px) 180px, 100vw"
                        className="aspect-[4/3] sm:aspect-auto sm:h-full"
                        imagenClassName="transition duration-500 group-hover:scale-[1.02]"
                      />
                      <div className="min-w-0 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-lg font-bold tracking-tight text-primary">
                            <Link href={`/canchas/${cancha.id}`} className="hover:text-secondary">
                              {cancha.nombre}
                            </Link>
                          </h3>
                          <Insignia tono="verde">
                            {etiquetaEstadoCancha(cancha.estado)}
                          </Insignia>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
                          <Icono nombre="ubicacion" className="h-4 w-4 text-secondary" />
                          {cancha.ubicacion}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Insignia>
                            <Icono nombre="cancha" className="h-3.5 w-3.5" />
                            {etiquetaDisciplinas(cancha)}
                          </Insignia>
                          <Insignia>
                            <Icono nombre="usuarios" className="h-3.5 w-3.5" />
                            Capacidad {cancha.capacidad}
                          </Insignia>
                        </div>
                        <Link
                          href={`/canchas/${cancha.id}`}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-secondary/80"
                        >
                          Ver horarios
                          <Icono nombre="flecha" className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="border-b border-outline-variant/30 bg-surface-container-lowest">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
            <div>
              <p className="text-sm font-semibold text-secondary">Equipamiento</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-primary sm:text-4xl">
                Alquilá lo que te falta
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-on-surface-variant sm:text-base">
                El equipamiento se suma a tu reserva según el stock disponible
                del club.
              </p>
              <Link
                href="/canchas"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary-soft px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-secondary-container/40"
              >
                Reservar con equipamiento
                <Icono nombre="flecha" className="h-4 w-4" />
              </Link>
            </div>

            {cargando ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <Esqueleto key={item} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : errores.equipamiento ? (
              <EstadoError
                mensaje={errores.equipamiento}
                onReintentar={reintentar}
              />
            ) : equipamiento.length === 0 ? (
              <EstadoVacio
                titulo="No hay equipamiento disponible"
                descripcion="El club no tiene equipamiento disponible para alquilar en este momento."
                accion={
                  <Link
                    href="/canchas"
                    className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Ver canchas
                  </Link>
                }
                icono="equipamiento"
              />
            ) : (
              <ul className="space-y-3">
                {equipamiento.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-primary">{item.nombre}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {aEtiquetaDisciplina(item.disciplinaNombre)} ·{" "}
                        {item.stockDisponible} disponibles
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1.5 sm:text-right">
                      <span className="text-lg font-extrabold text-secondary">
                        {formatearMoneda(item.precioUnitario)}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        por unidad
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          id="como-funciona"
          className="scroll-mt-24 border-b border-outline-variant/30 bg-surface-container-low"
        >
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <p className="text-sm font-semibold text-secondary">Cómo funciona</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-primary sm:text-4xl">
              De la idea al turno en tres pasos
            </h2>
            <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
              {PASOS.map((paso, indice) => (
                <article
                  key={paso.titulo}
                  className="relative rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
                      <Icono nombre={paso.icono} className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold text-outline">
                      Paso {indice + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-primary">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    {paso.descripcion}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-outline-variant/30 bg-surface-container-lowest">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
              <div>
                <p className="text-sm font-semibold text-secondary">
                  Preguntas frecuentes
                </p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-primary sm:text-4xl">
                  Lo que necesitás saber
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-on-surface-variant sm:text-base">
                  Reservas, equipamiento y cancelaciones en respuestas cortas.
                </p>
              </div>
              <div className="space-y-3">
                {PREGUNTAS.map((item) => (
                  <details
                    key={item.pregunta}
                    className="group rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 open:bg-surface-container-lowest"
                  >
                    <summary className="cursor-pointer list-none pr-8 text-sm font-bold text-primary marker:hidden">
                      {item.pregunta}
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                      {item.respuesta}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between md:py-20">
            <div>
              <p className="text-sm font-semibold text-secondary-container">
                Tu próximo turno
              </p>
              <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
                Creá tu cuenta y reservá tu primer turno.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                Gestioná tus reservas y tu equipamiento desde cualquier
                dispositivo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-5 py-3 text-sm font-bold text-primary transition hover:bg-secondary-container/90"
              >
                Crear cuenta
                <Icono nombre="flecha" className="h-4 w-4" />
              </Link>
              <Link
                href="/canchas"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver disponibilidad
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="horarios"
        className="scroll-mt-24 border-t border-white/10 bg-primary text-white"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-sm font-bold text-primary">
                CD
              </div>
              <span className="font-bold">Club Deportivo</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              Reservá tu cancha, sumá equipamiento y gestioná tus turnos en
              pocos pasos.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-secondary-container">
              Horarios
            </h2>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/75">
              <Icono nombre="reloj" className="h-4 w-4" />
              Todos los días de {APERTURA} a {CIERRE} hs
            </p>
            <p className="mt-2 text-sm text-white/60">
              Turnos de una hora, sin margen entre franjas.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-secondary-container">
              Accesos
            </h2>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/75">
              <Link href="/canchas" className="hover:text-white">
                Ver disponibilidad
              </Link>
              <Link href="/login" className="hover:text-white">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="hover:text-white">
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/60 sm:px-6">
            © 2026 Club Deportivo. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
