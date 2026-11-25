"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import ImagenDisciplina from "@/app/componentes/ui/imagen-disciplina";
import { EstadoError, EstadoVacio } from "@/app/componentes/ui/estado";
import { Esqueleto } from "@/app/componentes/ui/esqueleto";
import { Icono } from "@/app/componentes/ui/iconos";
import { Insignia } from "@/app/componentes/ui/insignia";
import type { EquipamientoApi } from "@/lib/api";
import {
  ApiError,
  crearAlquiler,
  crearReserva,
  mensajeDeError,
  obtenerCancha,
  obtenerEquipamiento,
  obtenerTurnos,
} from "@/lib/api";
import type { CanchaUI } from "@/lib/adaptadores";
import {
  aCanchaUI,
  aEtiquetaDisciplina,
  aMapaNombres,
  etiquetaDisciplinas,
  limitarCantidad,
  textoItemsAlquiler,
  totalAlquilerPrevisto,
} from "@/lib/adaptadores";
import {
  diaSemana,
  etiquetaFechaRelativa,
  formatearFecha,
  obtenerFechaLocalHoy,
} from "@/lib/fechas";
import { formatearMoneda } from "@/lib/formato";

type Resultado = {
  clave: string;
  cancha: CanchaUI | null;
  disciplinaNombre: string;
  horaFin: string;
  equipamiento: EquipamientoApi[];
  turnoDisponible: boolean;
  error: string | null;
};

type Paso = 1 | 2 | 3;

const MENSAJE_TURNO_OCUPADO = "Ese turno ya no está disponible.";

const PASOS: { numero: Paso; titulo: string; detalle: string }[] = [
  { numero: 1, titulo: "Turno", detalle: "Cancha, fecha y hora" },
  { numero: 2, titulo: "Equipamiento", detalle: "Opcional" },
  { numero: 3, titulo: "Confirmación", detalle: "Revisá y reservá" },
];

export default function ReservarClient({ canchaId }: { canchaId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const fecha = searchParams.get("fecha") ?? "";
  const hora = searchParams.get("hora") ?? "";
  const turnoId = searchParams.get("turnoId") ?? "";
  const hoy = obtenerFechaLocalHoy();

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [intento, setIntento] = useState(0);
  const [paso, setPaso] = useState<Paso>(1);
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorTurno, setErrorTurno] = useState(false);
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | null>(
    null,
  );

  const clave = `${canchaId}|${turnoId}|${fecha}|${intento}`;
  const cargando = resultado?.clave !== clave;
  const error = resultado?.error ?? null;
  const cancha = resultado?.cancha ?? null;
  const disciplinaNombre = resultado?.disciplinaNombre ?? "";
  const horaFin = resultado?.horaFin ?? hora;
  const equipamiento = resultado?.equipamiento ?? [];
  const turnoDisponible = resultado?.turnoDisponible !== false;

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const turnos = await obtenerTurnos({ canchaId, fecha });
        const turno = turnos.find((t) => t.id === turnoId);
        if (!turno) throw new Error("No encontramos el turno elegido.");
        const canchaObtenida = await obtenerCancha(canchaId);
        const items = await obtenerEquipamiento({
          disciplinaId: turno.disciplina_id,
          disponible: true,
        });
        const disciplina = canchaObtenida.disciplinas.find(
          (d) => d.id === turno.disciplina_id,
        );
        if (cancelado) return;
        setResultado({
          clave,
          cancha: aCanchaUI(canchaObtenida),
          disciplinaNombre: disciplina?.nombre ?? "",
          horaFin: turno.hora_fin.slice(0, 5),
          equipamiento: items.filter(
            (item) => item.activo && item.stockDisponible > 0,
          ),
          turnoDisponible: turno.disponible,
          error: null,
        });
        setErrorTurno(!turno.disponible);
      } catch (e) {
        if (cancelado) return;
        setResultado({
          clave,
          cancha: null,
          disciplinaNombre: "",
          horaFin: "",
          equipamiento: [],
          turnoDisponible: false,
          error: mensajeDeError(e),
        });
      }
    }
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [clave, canchaId, turnoId, fecha]);

  function stockDe(id: string): number {
    return equipamiento.find((item) => item.id === id)?.stockDisponible ?? 0;
  }

  function alternarEquipamiento(id: string) {
    setMarcados((prev) => ({ ...prev, [id]: !prev[id] }));
    setCantidades((prev) =>
      prev[id] === undefined ? { ...prev, [id]: 1 } : prev,
    );
  }

  function cambiarCantidad(id: string, valor: string) {
    const cantidad = Math.trunc(Number(valor));
    if (!Number.isFinite(cantidad)) return;
    setCantidades((prev) => ({ ...prev, [id]: cantidad }));
  }

  function ajustarCantidad(id: string, delta: number) {
    const actual = cantidades[id] ?? 1;
    setCantidades((prev) => ({
      ...prev,
      [id]: limitarCantidad(actual + delta, stockDe(id)),
    }));
  }

  function normalizarCantidad(id: string) {
    setCantidades((prev) => ({
      ...prev,
      [id]: limitarCantidad(prev[id] ?? 1, stockDe(id)),
    }));
  }

  const seleccionados = equipamiento
    .filter((item) => marcados[item.id])
    .map((item) => ({
      equipamientoId: item.id,
      cantidad: cantidades[item.id] ?? 1,
    }));
  const cantidadesInvalidas = seleccionados.filter((item) => {
    const stock = stockDe(item.equipamientoId);
    return item.cantidad < 1 || item.cantidad > stock;
  });
  const limiteInvalido = cantidadesInvalidas.length > 0;
  const nombres: Record<string, string> = aMapaNombres(equipamiento);
  const detalleEquipamiento =
    seleccionados.length > 0
      ? textoItemsAlquiler(seleccionados, nombres)
      : "Sin equipamiento";
  const totalPrevisto = totalAlquilerPrevisto(seleccionados, equipamiento);
  const puedeConfirmar =
    !enviando && !limiteInvalido && turnoDisponible && Boolean(cancha);

  async function confirmarReserva() {
    if (!puedeConfirmar) return;
    setEnviando(true);
    setErrorConfirmacion(null);
    try {
      const reserva = await crearReserva(turnoId);
      if (seleccionados.length > 0) {
        try {
          await crearAlquiler(reserva.id, seleccionados);
        } catch {
          // La reserva ya existe: el alquiler se puede reintentar en Mis reservas.
          router.push("/reservas?reserva=creada&alquiler=error");
          return;
        }
      }
      router.push("/reservas?reserva=creada");
    } catch (e) {
      setEnviando(false);
      if (e instanceof ApiError && e.status === 409) {
        setErrorTurno(true);
        setIntento((n) => n + 1);
        setPaso(1);
        return;
      }
      setErrorConfirmacion(mensajeDeError(e));
    }
  }

  function continuar() {
    if (paso === 1) {
      setPaso(2);
      return;
    }
    if (paso === 2) {
      setPaso(3);
      return;
    }
    void confirmarReserva();
  }

  if (!turnoId || !fecha || !hora) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EstadoVacio
          titulo="No encontramos el turno elegido"
          descripcion="Volvé al listado de canchas y elegí una franja disponible."
          accion={
            <Link
              href="/canchas"
              className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Cambiar turno
            </Link>
          }
          icono="calendario"
        />
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <Esqueleto className="h-4 w-44" />
        <Esqueleto className="mt-3 h-10 w-72" />
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <Esqueleto className="h-64 rounded-3xl" />
            <Esqueleto className="h-36 rounded-3xl" />
          </div>
          <Esqueleto className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!cargando && error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EstadoError
          mensaje={error}
          onReintentar={() => setIntento((n) => n + 1)}
        />
      </div>
    );
  }

  if (!cancha) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EstadoVacio
          titulo="No encontramos el turno elegido"
          descripcion="Puede que la franja haya cambiado. Elegí otro turno para continuar."
          accion={
            <Link
              href="/canchas"
              className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Ver canchas
            </Link>
          }
          icono="calendario"
        />
      </div>
    );
  }

  const mostrarAlertaTurno = errorTurno || !turnoDisponible;
  const fechaResumen = `${etiquetaFechaRelativa(fecha, hoy)} · ${hora} a ${horaFin} hs`;
  const etiquetaDisciplina = disciplinaNombre
    ? aEtiquetaDisciplina(disciplinaNombre)
    : "Disciplina";
  const etiquetaBoton =
    paso === 1
      ? "Elegir equipamiento"
      : paso === 2
        ? "Revisar reserva"
        : enviando
          ? "Confirmando..."
          : "Confirmar reserva";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
        <Link
          href="/canchas"
          className="underline-offset-4 hover:text-on-surface hover:underline"
        >
          Canchas
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/canchas/${canchaId}`}
          className="underline-offset-4 hover:text-on-surface hover:underline"
        >
          {cancha.nombre}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-on-surface">Reservar</span>
      </nav>

      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          Paso {paso} de 3
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-[-0.01em] text-on-surface sm:text-5xl">
          Confirmá tu reserva
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          Revisá el turno, sumá equipamiento si lo necesitás y confirmá en un
          solo lugar.
        </p>
      </header>

      <ol
        aria-label="Pasos de la reserva"
        className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-2"
      >
        {PASOS.map((item) => {
          const activo = paso === item.numero;
          const completado = paso > item.numero;
          return (
            <li
              key={item.numero}
              aria-current={activo ? "step" : undefined}
              className={`flex min-w-0 items-center gap-2 rounded-xl px-2 py-2.5 sm:px-3 ${
                activo ? "bg-secondary-soft text-secondary" : "text-on-surface-variant"
              }`}
            >
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-display text-base font-bold ${
                  completado
                    ? "bg-secondary text-white"
                    : activo
                      ? "bg-primary text-secondary-container"
                      : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {completado ? (
                  <Icono nombre="check" className="h-4 w-4" />
                ) : (
                  item.numero
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {item.titulo}
                </span>
                <span className="hidden truncate text-xs sm:block">
                  {item.detalle}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {mostrarAlertaTurno ? (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/20 bg-danger-container px-4 py-3 text-sm font-medium text-on-danger-container"
        >
          <span className="flex items-center gap-2">
            <Icono nombre="advertencia" className="h-4 w-4 flex-shrink-0" />
            {MENSAJE_TURNO_OCUPADO}
          </span>
          <Link
            href={`/canchas/${canchaId}`}
            className="rounded-full border border-danger/20 bg-white px-3 py-1.5 text-xs font-semibold text-on-danger-container transition hover:bg-white/80"
          >
            Ver franjas disponibles
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          {paso === 1 ? (
            <section className="overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
              <div className="grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <ImagenDisciplina
                  disciplina={disciplinaNombre}
                  alt={`Cancha de ${etiquetaDisciplina}`}
                  className="h-52 sm:h-full sm:min-h-64"
                  sizes="(min-width: 1024px) 28vw, (min-width: 640px) 42vw, 100vw"
                />
                <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    <Insignia tono={turnoDisponible ? "verde" : "rojo"}>
                      <Icono nombre="calendario" className="h-3.5 w-3.5" />
                      {turnoDisponible ? "Turno disponible" : "Turno ocupado"}
                    </Insignia>
                    {disciplinaNombre ? (
                      <Insignia>{etiquetaDisciplina}</Insignia>
                    ) : null}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">
                      {cancha.nombre}
                    </h2>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {cancha.ubicacion} · {cancha.capacidad} personas
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      Turno elegido
                    </p>
                    <p className="mt-1 text-lg font-bold text-on-surface">
                      {diaSemana(fecha)} {formatearFecha(fecha)}
                    </p>
                    <p className="text-sm font-medium text-secondary">
                      {hora} a {horaFin} hs
                    </p>
                  </div>
                  <Link
                    href={`/canchas/${canchaId}`}
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-outline-variant/70 bg-white px-4 py-2 text-sm font-semibold text-on-surface transition hover:border-secondary/40 hover:text-secondary"
                  >
                    Cambiar turno
                    <Icono nombre="flecha" className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {paso === 2 ? (
            <section className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-on-surface">
                    Sumá equipamiento
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Es opcional. El stock y el precio salen del catálogo real.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaso(3)}
                  className="text-sm font-semibold text-secondary underline-offset-4 hover:underline"
                >
                  Continuar sin equipamiento
                </button>
              </div>

              {equipamiento.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-low px-5 py-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-secondary">
                    <Icono nombre="equipamiento" className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-on-surface">
                    No hay equipamiento disponible para este turno.
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Podés continuar con la reserva sin alquilar nada.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPaso(3)}
                    className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    Continuar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipamiento.map((item) => {
                    const marcado = marcados[item.id] ?? false;
                    const cantidad = cantidades[item.id] ?? 1;
                    const invalida =
                      marcado &&
                      (cantidad < 1 || cantidad > item.stockDisponible);
                    const inputId = `equipamiento-${item.id}`;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 transition ${
                          marcado
                            ? "border-secondary/40 bg-secondary-soft/40"
                            : "border-outline-variant/50 bg-white"
                        }`}
                      >
                        <div className="flex flex-wrap items-start gap-3">
                          <input
                            type="checkbox"
                            id={inputId}
                            checked={marcado}
                            onChange={() => alternarEquipamiento(item.id)}
                            className="mt-1 h-4 w-4 flex-shrink-0 accent-secondary"
                          />
                          <div className="min-w-0 flex-1">
                            <label
                              htmlFor={inputId}
                              className="cursor-pointer text-sm font-bold text-on-surface"
                            >
                              {item.nombre}
                            </label>
                            <p className="mt-0.5 text-xs text-on-surface-variant">
                              {aEtiquetaDisciplina(item.disciplina.nombre)} ·{" "}
                              {formatearMoneda(item.precioUnitario)} c/u
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-secondary">
                              {item.stockDisponible} disponibles
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => ajustarCantidad(item.id, -1)}
                              disabled={!marcado || cantidad <= 1}
                              aria-label={`Quitar una unidad de ${item.nombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/60 text-sm font-bold text-on-surface transition hover:border-secondary/40 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.stockDisponible}
                              inputMode="numeric"
                              disabled={!marcado}
                              value={cantidad}
                              onChange={(e) =>
                                cambiarCantidad(item.id, e.target.value)
                              }
                              onBlur={() => normalizarCantidad(item.id)}
                              aria-label={`Cantidad de ${item.nombre}`}
                              aria-invalid={invalida}
                              className="h-8 w-14 rounded-lg border border-outline-variant/60 bg-white px-1 text-center text-sm font-semibold text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 disabled:bg-surface-container-low disabled:text-on-surface-variant"
                            />
                            <button
                              type="button"
                              onClick={() => ajustarCantidad(item.id, 1)}
                              disabled={!marcado}
                              aria-label={`Agregar una unidad de ${item.nombre}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/60 text-sm font-bold text-on-surface transition hover:border-secondary/40 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {invalida ? (
                          <p
                            role="alert"
                            className="mt-2 text-xs font-semibold text-danger"
                          >
                            La cantidad debe estar entre 1 y{" "}
                            {item.stockDisponible}.
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {paso === 3 ? (
            <section className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
                  <Icono nombre="check" className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-on-surface">
                    Todo listo para reservar
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                    Revisá el resumen. Al confirmar, el turno queda reservado y
                    lo vas a ver en Mis reservas.
                  </p>
                </div>
              </div>

              <dl className="mt-5 divide-y divide-outline-variant/40 rounded-2xl border border-outline-variant/50 bg-white px-4">
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-on-surface-variant">Cancha</dt>
                  <dd className="text-right text-sm font-semibold text-on-surface">
                    {cancha.nombre}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-on-surface-variant">Fecha</dt>
                  <dd className="text-right text-sm font-semibold text-on-surface">
                    {diaSemana(fecha)} {formatearFecha(fecha)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-on-surface-variant">Horario</dt>
                  <dd className="text-right text-sm font-semibold text-on-surface">
                    {hora} a {horaFin} hs
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-on-surface-variant">
                    Equipamiento
                  </dt>
                  <dd className="text-right text-sm font-semibold text-on-surface">
                    {seleccionados.length === 0 ? (
                      "Sin equipamiento"
                    ) : (
                      <ul className="space-y-1">
                        {seleccionados.map((item) => {
                          const equipo = equipamiento.find(
                            (e) => e.id === item.equipamientoId,
                          );
                          return (
                            <li key={item.equipamientoId}>
                              {item.cantidad} ×{" "}
                              {equipo?.nombre ?? "Equipamiento"} ·{" "}
                              {formatearMoneda(
                                (equipo?.precioUnitario ?? 0) * item.cantidad,
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </dd>
                </div>
                {seleccionados.length > 0 ? (
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-sm text-on-surface-variant">
                      Total del alquiler
                    </dt>
                    <dd className="text-right text-base font-extrabold text-on-surface">
                      {formatearMoneda(totalPrevisto)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="text-sm font-semibold text-secondary underline-offset-4 hover:underline"
                >
                  Editar equipamiento
                </button>
                <p className="text-xs text-on-surface-variant">
                  Podés cancelar hasta 2 horas antes del turno.
                </p>
              </div>
            </section>
          ) : null}

          {paso > 1 ? (
            <button
              type="button"
              onClick={() => setPaso((paso - 1) as Paso)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition hover:text-on-surface"
            >
              <Icono nombre="flecha" className="h-4 w-4 rotate-180" />
              Volver
            </button>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24">
          <section className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4">
              <ImagenDisciplina
                disciplina={disciplinaNombre}
                alt={`Cancha de ${etiquetaDisciplina}`}
                className="h-16 w-16 flex-shrink-0 rounded-2xl"
                sizes="64px"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Resumen
                </p>
                <p className="truncate text-base font-extrabold text-on-surface">
                  {cancha.nombre}
                </p>
                <p className="truncate text-xs text-on-surface-variant">
                  {etiquetaDisciplinas(cancha)}
                </p>
              </div>
            </div>

            <dl className="space-y-2.5 py-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-on-surface-variant">Fecha</dt>
                <dd className="text-right font-semibold capitalize text-on-surface">
                  {fechaResumen}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-on-surface-variant">Estado del turno</dt>
                <dd>
                  <Insignia tono={turnoDisponible ? "verde" : "rojo"}>
                    {turnoDisponible ? "Disponible" : "No disponible"}
                  </Insignia>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-on-surface-variant">Equipamiento</dt>
                <dd className="max-w-[12rem] text-right font-semibold text-on-surface">
                  {detalleEquipamiento}
                </dd>
              </div>
              {seleccionados.length > 0 ? (
                <div className="flex items-start justify-between gap-3 border-t border-outline-variant/40 pt-2.5">
                  <dt className="text-on-surface-variant">Total previsto</dt>
                  <dd
                    aria-live="polite"
                    className="text-right text-base font-extrabold text-on-surface"
                  >
                    {formatearMoneda(totalPrevisto)}
                  </dd>
                </div>
              ) : null}
            </dl>

            {limiteInvalido ? (
              <p
                role="alert"
                className="mb-3 rounded-xl border border-warning/25 bg-warning-container px-3 py-2 text-xs font-semibold text-on-warning-container"
              >
                Revisá las cantidades: deben estar entre 1 y el stock
                disponible.
              </p>
            ) : null}

            {!turnoDisponible ? (
              <Link
                href={`/canchas/${canchaId}`}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Elegir otro turno
                <Icono nombre="flecha" className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={continuar}
                disabled={paso === 3 && !puedeConfirmar}
                aria-busy={enviando}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
              >
                {etiquetaBoton}
                {paso < 3 ? (
                  <Icono nombre="flecha" className="h-4 w-4" />
                ) : null}
              </button>
            )}

            {errorConfirmacion ? (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-danger/20 bg-danger-container px-3 py-2 text-xs font-semibold text-on-danger-container"
              >
                {errorConfirmacion}
              </p>
            ) : null}

            <p className="mt-3 text-center text-xs leading-relaxed text-on-surface-variant">
              La reserva se confirma al finalizar el paso 3.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
