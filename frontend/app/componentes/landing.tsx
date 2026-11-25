"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import ImagenDisciplina from "@/app/componentes/ui/imagen-disciplina";
import { Icono } from "@/app/componentes/ui/iconos";
import { Insignia } from "@/app/componentes/ui/insignia";
import { Esqueleto } from "@/app/componentes/ui/esqueleto";
import Marca from "@/app/componentes/ui/marca";
import { EstadoError, EstadoVacio } from "@/app/componentes/ui/estado";
import type { DisciplinaApi } from "@/lib/api";
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
  const [headerDesplazado, setHeaderDesplazado] = useState(false);

  useEffect(() => {
    function alDesplazar() {
      setHeaderDesplazado(window.scrollY > 40);
    }

    window.addEventListener("scroll", alDesplazar, { passive: true });
    alDesplazar();

    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  useEffect(() => {
    const elementos = Array.from(
      document.querySelectorAll<HTMLElement>("[data-animar]"),
    );

    if (elementos.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      elementos.forEach((elemento) =>
        elemento.classList.add("esta-visible"),
      );
      return;
    }

    const observador = new IntersectionObserver(
      (entradas, observer) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;

          entrada.target.classList.add("esta-visible");
          observer.unobserve(entrada.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    elementos.forEach((elemento) => {
      if (!elemento.classList.contains("esta-visible")) {
        observador.observe(elemento);
      }
    });

    return () => observador.disconnect();
  }, [contenido]);

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
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          headerDesplazado
            ? "border-white/10 bg-primary/45 backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-8">
          <Marca tono="claro" />

          <nav className="hidden items-center gap-7 lg:flex">
            {LINKS_SECCION.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/75 transition hover:text-white"
              >
                {link.texto}
              </a>
            ))}
          </nav>

          <div className="flex flex-shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-white sm:px-5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              Registrate
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative flex min-h-[90svh] items-center overflow-hidden bg-primary text-white sm:min-h-[92svh]">
          <Image
            src="/img/hero.webp"
            alt="Cancha de tenis del club"
            fill
            priority
            sizes="100vw"
            className="pointer-events-none object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,24,16,0.72)_0%,rgba(14,24,16,0.88)_100%)]" />

          <div className="relative z-10 mx-auto flex w-full max-w-[1000px] flex-col items-center justify-center px-4 pb-24 pt-32 text-center sm:px-8 lg:pb-32 lg:pt-36">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm transition duration-700 animate-in fade-in slide-in-from-bottom-3">
              <span className="pulso-disponible h-1.5 w-1.5 rounded-full bg-secondary-container" />
              Turnos reales, sin vueltas
            </p>

            <h1 className="mt-7 max-w-3xl font-display text-6xl leading-[1.05] tracking-tight text-white transition duration-700 delay-100 animate-in fade-in slide-in-from-bottom-4 sm:text-7xl xl:text-[6.2rem]">
              Tu próximo partido empieza en{" "}
              <em className="italic text-secondary-container">MatchPoint.</em>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 transition duration-700 delay-150 animate-in fade-in slide-in-from-bottom-4 sm:text-lg">
              Elegí disciplina, fecha y horario. Confirmá tu turno y sumá
              equipamiento en la misma reserva.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 transition duration-700 delay-200 animate-in fade-in slide-in-from-bottom-4">
              <Link
                href="/canchas"
                className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-6 py-3 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-white"
              >
                Ver disponibilidad
                <Icono nombre="flecha" className="h-4 w-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Cómo funciona
              </a>
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/75 transition duration-700 delay-300 animate-in fade-in">
              <Icono
                nombre="reloj"
                className="h-4 w-4 text-secondary-container"
              />
              Todos los días de {APERTURA} a {CIERRE} hs
            </p>
          </div>
        </section>

        <section
          id="disciplinas"
          className="scroll-mt-24 border-b border-outline-variant/30"
        >
          <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8 sm:py-24 md:py-28">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div data-animar>
                <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                  <Icono nombre="cancha" className="h-4 w-4" />
                  Disciplinas
                </p>
                <h2 className="mt-1 font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
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
                  <div
                    key={item}
                    className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest"
                  >
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
                {disciplinas.map((disciplina, indice) => {
                  const duracion = formatearDuracion(
                    disciplina.duracionTipicaMinutos,
                  );
                  return (
                    <article
                      key={disciplina.id}
                      data-animar
                      style={{ transitionDelay: `${Math.min(indice, 6) * 70}ms` }}
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
                        <h3 className="font-display text-3xl leading-tight text-primary">
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
          <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8 sm:py-24 md:py-28">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div data-animar>
                <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                  <Icono nombre="ubicacion" className="h-4 w-4" />
                  Canchas
                </p>
                <h2 className="mt-1 font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
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
                  <div
                    key={item}
                    className="grid overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest sm:grid-cols-[170px_1fr]"
                  >
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
                {canchas.map((cancha, indice) => {
                  const disciplinaPrincipal =
                    cancha.disciplinas[0]?.nombre ?? "";
                  return (
                    <article
                      key={cancha.id}
                      data-animar
                      style={{ transitionDelay: `${indice * 70}ms` }}
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
                          <h3 className="font-display text-2xl leading-tight text-primary">
                            <Link
                              href={`/canchas/${cancha.id}`}
                              className="hover:text-secondary"
                            >
                              {cancha.nombre}
                            </Link>
                          </h3>
                          <Insignia tono="verde">
                            {etiquetaEstadoCancha(cancha.estado)}
                          </Insignia>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
                          <Icono
                            nombre="ubicacion"
                            className="h-4 w-4 text-secondary"
                          />
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
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-20 sm:px-8 sm:py-24 md:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
            <div data-animar>
              <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                <Icono nombre="equipamiento" className="h-4 w-4" />
                Equipamiento
              </p>
              <h2 className="mt-1 font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
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
                {equipamiento.map((item, indice) => (
                  <li
                    key={item.id}
                    data-animar
                    style={{ transitionDelay: `${indice * 70}ms` }}
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
                      <span className="text-lg font-semibold text-secondary">
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
          <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8 sm:py-24 md:py-28">
            <div data-animar>
              <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                <Icono nombre="rayo" className="h-4 w-4" />
                Cómo funciona
              </p>
              <h2 className="mt-1 font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
                De la idea al turno en tres pasos
              </h2>
            </div>
            <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
              {PASOS.map((paso, indice) => (
                <article
                  key={paso.titulo}
                  data-animar
                  style={{ transitionDelay: `${indice * 90}ms` }}
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
                  <h3 className="mt-5 font-display text-2xl leading-tight text-primary">
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
          <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8 sm:py-24 md:py-28">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
              <div data-animar>
                <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                  <Icono nombre="informacion" className="h-4 w-4" />
                  Preguntas frecuentes
                </p>
                <h2 className="mt-1 font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
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
                    <summary className="cursor-pointer list-none pr-8 text-sm font-medium text-primary marker:hidden">
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

        <section className="relative overflow-hidden bg-primary text-white">
          <Image
            src="/img/hero.webp"
            alt="Cancha de tenis del club"
            fill
            priority
            sizes="100vw"
            className="pointer-events-none object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,24,16,0.72)_0%,rgba(14,24,16,0.88)_100%)]" />

          <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-[1000px] flex-col items-center justify-center px-4 py-20 text-center sm:px-8 lg:py-28">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm transition duration-700 animate-in fade-in slide-in-from-bottom-3">
              <span className="pulso-disponible h-1.5 w-1.5 rounded-full bg-secondary-container" />
              Turnos reales, sin vueltas
            </p>

            <h1 className="mt-7 max-w-3xl font-display text-6xl leading-[1.05] tracking-tight text-white transition duration-700 delay-100 animate-in fade-in slide-in-from-bottom-4 sm:text-7xl xl:text-[6.2rem]">
              Tu próximo partido empieza en{" "}
              <em className="italic text-secondary-container">MatchPoint.</em>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 transition duration-700 delay-150 animate-in fade-in slide-in-from-bottom-4 sm:text-lg">
              Elegí disciplina, fecha y horario. Confirmá tu turno y sumá
              equipamiento en la misma reserva.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 transition duration-700 delay-200 animate-in fade-in slide-in-from-bottom-4">
              <Link
                href="/canchas"
                className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-6 py-3 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-white"
              >
                Ver disponibilidad
                <Icono nombre="flecha" className="h-4 w-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Cómo funciona
              </a>
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/75 transition duration-700 delay-300 animate-in fade-in">
              <Icono
                nombre="reloj"
                className="h-4 w-4 text-secondary-container"
              />
              Todos los días de {APERTURA} a {CIERRE} hs
            </p>
          </div>
        </section>
      </main>

      <footer
        id="horarios"
        className="scroll-mt-24 border-t border-white/10 bg-primary text-white"
      >
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <Marca tono="claro" conEnlace={false} />
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
            <p className="mt-3 text-sm text-white/80">
              Todos los días de {APERTURA} a {CIERRE} hs
            </p>
            <p className="mt-1 text-xs text-white/60">
              Cancelaciones disponibles hasta 2 horas antes del turno.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-secondary-container">
              Secciones
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {LINKS_SECCION.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="transition hover:text-secondary-container"
                  >
                    {link.texto}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}