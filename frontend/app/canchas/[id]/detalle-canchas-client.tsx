"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Esqueleto } from "@/app/componentes/ui/esqueleto";
import { EstadoError, EstadoVacio } from "@/app/componentes/ui/estado";
import ImagenDisciplina from "@/app/componentes/ui/imagen-disciplina";
import { Icono } from "@/app/componentes/ui/iconos";
import { Insignia } from "@/app/componentes/ui/insignia";
import type { CanchaUI, TurnoUI } from "@/lib/adaptadores";
import {
  aCanchaUI,
  aEtiquetaDisciplina,
  aTurnoUI,
  descripcionDisciplina,
  etiquetaDisciplinas,
  etiquetaEstadoCancha,
} from "@/lib/adaptadores";
import {
  ApiError,
  mensajeDeError,
  obtenerCancha,
  obtenerTurnos,
} from "@/lib/api";
import {
  formatearFechaAbreviada,
  generarDiasCalendario,
  obtenerFechaLocalHoy,
} from "@/lib/fechas";
import { formatearDuracion } from "@/lib/formato";

export default function DetalleCanchaClient({
  canchaId,
}: {
  canchaId: string;
}) {
  const [fecha, setFecha] = useState(obtenerFechaLocalHoy);
  const [cancha, setCancha] = useState<CanchaUI | null>(null);
  const [cargandoCancha, setCargandoCancha] = useState(true);
  const [errorCancha, setErrorCancha] = useState<string | null>(null);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [intentoCancha, setIntentoCancha] = useState(0);

  const [turnos, setTurnos] = useState<TurnoUI[]>([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(true);
  const [errorTurnos, setErrorTurnos] = useState<string | null>(null);
  const [intentoTurnos, setIntentoTurnos] = useState(0);

  useEffect(() => {
    let cancelado = false;
    async function cargarCancha() {
      setCargandoCancha(true);
      setErrorCancha(null);
      setNoEncontrada(false);
      try {
        const datos = await obtenerCancha(canchaId);
        if (!cancelado) setCancha(aCanchaUI(datos));
      } catch (e) {
        if (cancelado) return;
        if (e instanceof ApiError && e.status === 404) {
          setNoEncontrada(true);
        } else {
          setErrorCancha(mensajeDeError(e));
        }
      } finally {
        if (!cancelado) setCargandoCancha(false);
      }
    }
    void cargarCancha();
    return () => {
      cancelado = true;
    };
  }, [canchaId, intentoCancha]);

  useEffect(() => {
    let cancelado = false;
    async function cargarTurnos() {
      setCargandoTurnos(true);
      setErrorTurnos(null);
      try {
        const datos = await obtenerTurnos({ canchaId, fecha });
        if (!cancelado) setTurnos(datos.map(aTurnoUI));
      } catch (e) {
        if (!cancelado) setErrorTurnos(mensajeDeError(e));
      } finally {
        if (!cancelado) setCargandoTurnos(false);
      }
    }
    void cargarTurnos();
    return () => {
      cancelado = true;
    };
  }, [canchaId, fecha, intentoTurnos]);

  const dias = generarDiasCalendario(obtenerFechaLocalHoy(), 7);

  if (cargandoCancha && !cancha) {
    return <CargandoDetalle />;
  }

  if (noEncontrada) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <EstadoVacio
          titulo="No encontramos esta cancha"
          descripcion="Puede que el enlace esté vencido o que la cancha ya no esté publicada."
          accion={
            <Link
              href="/canchas"
              className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Volver a las canchas
            </Link>
          }
          icono="cancha"
        />
      </div>
    );
  }

  if (errorCancha && !cancha) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <EstadoError
          mensaje={errorCancha}
          onReintentar={() => setIntentoCancha((n) => n + 1)}
        />
      </div>
    );
  }

  if (!cancha) return null;

  const disciplinaPrincipal = cancha.disciplinas[0]?.nombre ?? "";
  const tonoEstado =
    cancha.estado === "DISPONIBLE"
      ? "verde"
      : cancha.estado === "OCUPADA"
        ? "amarillo"
        : "rojo";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/canchas"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition hover:text-secondary"
      >
        <Icono nombre="flecha" className="h-4 w-4 rotate-180" />
        Volver a las canchas
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-7 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10">
        <div>
          <ImagenDisciplina
            disciplina={disciplinaPrincipal}
            alt={`Cancha ${cancha.nombre}`}
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="aspect-[16/10] rounded-[2rem] border border-outline-variant/30"
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <DatoCancha
              icono="ubicacion"
              etiqueta="Ubicación"
              valor={cancha.ubicacion}
            />
            <DatoCancha
              icono="usuarios"
              etiqueta="Capacidad"
              valor={`${cancha.capacidad} personas`}
            />
            <DatoCancha
              icono="cancha"
              etiqueta="Disciplinas"
              valor={etiquetaDisciplinas(cancha) || "Sin disciplinas"}
            />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Insignia tono={tonoEstado}>
              {etiquetaEstadoCancha(cancha.estado)}
            </Insignia>
            <Insignia>
              <Icono nombre="reloj" className="h-3.5 w-3.5" />
              Turnos de una hora
            </Insignia>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-primary sm:text-5xl">
            {cancha.nombre}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant sm:text-base">
            <Icono nombre="ubicacion" className="h-4 w-4 text-secondary" />
            {cancha.ubicacion}
          </p>

          <div className="mt-6 space-y-3">
            {cancha.disciplinas.length > 0 ? (
              cancha.disciplinas.map((disciplina) => {
                const duracion = formatearDuracion(
                  disciplina.duracionTipicaMinutos,
                );
                return (
                  <div
                    key={disciplina.id}
                    className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-bold text-primary">
                        {aEtiquetaDisciplina(disciplina.nombre)}
                      </h2>
                      {duracion ? (
                        <Insignia tono="verde">{duracion}</Insignia>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {disciplina.reglas?.trim() ||
                        descripcionDisciplina(disciplina)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl border border-dashed border-outline-variant/50 p-4 text-sm text-on-surface-variant">
                Esta cancha no tiene disciplinas cargadas.
              </p>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-secondary-soft p-4 text-sm leading-relaxed text-secondary">
            Elegí un turno libre en la grilla. Si no tenés sesión, te pedimos
            iniciar sesión y volvés directo a la confirmación.
          </div>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-secondary">Fecha</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-primary sm:text-3xl">
              Elegí el día
            </h2>
          </div>
          <p className="text-sm font-medium text-on-surface-variant">
            {formatearFechaAbreviada(fecha)}
          </p>
        </div>

        <div
          className="mt-4 flex gap-2 overflow-x-auto pb-2"
          role="group"
          aria-label="Selector de fecha"
        >
          {dias.map((dia) => {
            const activo = dia.fecha === fecha;
            return (
              <button
                key={dia.fecha}
                type="button"
                onClick={() => setFecha(dia.fecha)}
                aria-pressed={activo}
                aria-label={`${dia.etiqueta} ${dia.numero}`}
                className={`flex min-w-[72px] flex-col items-center rounded-2xl border px-3 py-3 text-center transition ${
                  activo
                    ? "border-secondary bg-secondary text-white shadow-sm"
                    : "border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:border-secondary/40 hover:bg-secondary-soft"
                }`}
              >
                <span
                  className={`text-xs font-semibold ${activo ? "text-white/70" : "text-on-surface-variant"}`}
                >
                  {dia.dia}
                </span>
                <span className="mt-0.5 text-xl font-extrabold">
                  {dia.numero}
                </span>
                <span
                  className={`mt-0.5 text-[11px] font-semibold ${activo ? "text-secondary-container" : "text-secondary"}`}
                >
                  {dia.etiqueta === "Hoy" || dia.etiqueta === "Mañana"
                    ? dia.etiqueta
                    : ""}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-secondary">Turnos</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-primary sm:text-3xl">
              {cargandoTurnos
                ? "Buscando horarios"
                : `${turnos.filter((turno) => turno.estado === "libre").length} libres`}
            </h2>
          </div>
          <p className="text-sm text-on-surface-variant">
            Los ocupados se muestran deshabilitados.
          </p>
        </div>

        {cargandoTurnos ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
              <Esqueleto key={item} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : errorTurnos ? (
          <div className="mt-5">
            <EstadoError
              mensaje={errorTurnos}
              onReintentar={() => setIntentoTurnos((n) => n + 1)}
            />
          </div>
        ) : turnos.length === 0 ? (
          <div className="mt-5">
            <EstadoVacio
              titulo="No hay turnos para esta fecha"
              descripcion="Elegí otro día en la franja de fechas para ver la disponibilidad."
              icono="calendario"
            />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {turnos.map((turno) => {
              if (turno.estado === "ocupado") {
                return (
                  <button
                    key={turno.id}
                    type="button"
                    disabled
                    title="Turno ocupado"
                    className="flex h-16 cursor-not-allowed flex-col items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container text-on-surface-variant/60"
                  >
                    <span className="text-sm font-bold line-through">
                      {turno.horaInicio.slice(0, 5)}
                    </span>
                    <span className="text-[11px]">Ocupado</span>
                  </button>
                );
              }

              return (
                <Link
                  key={turno.id}
                  href={`/canchas/${cancha.id}/reservar?fecha=${fecha}&hora=${turno.horaInicio}&turnoId=${turno.id}`}
                  className="flex h-16 flex-col items-center justify-center rounded-2xl border border-secondary/25 bg-secondary-soft text-secondary transition hover:border-secondary/50 hover:bg-secondary-container/50"
                >
                  <span className="text-sm font-bold">
                    {turno.horaInicio.slice(0, 5)}
                  </span>
                  <span className="text-[11px] font-semibold">Libre</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function DatoCancha({
  icono,
  etiqueta,
  valor,
}: {
  icono: "ubicacion" | "usuarios" | "cancha";
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
        <Icono nombre={icono} className="h-3.5 w-3.5 text-secondary" />
        {etiqueta}
      </span>
      <p className="mt-1 truncate text-sm font-bold text-primary">{valor}</p>
    </div>
  );
}

function CargandoDetalle() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Esqueleto className="h-4 w-36" />
      <div className="mt-6 grid grid-cols-1 gap-7 lg:grid-cols-[1.12fr_0.88fr]">
        <Esqueleto className="aspect-[16/10] rounded-[2rem]" />
        <div className="space-y-4">
          <Esqueleto className="h-7 w-32 rounded-full" />
          <Esqueleto className="h-12 w-4/5" />
          <Esqueleto className="h-5 w-1/2" />
          <Esqueleto className="h-28 rounded-2xl" />
        </div>
      </div>
      <Esqueleto className="mt-12 h-8 w-48" />
      <div className="mt-4 flex gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((item) => (
          <Esqueleto key={item} className="h-20 w-[72px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
