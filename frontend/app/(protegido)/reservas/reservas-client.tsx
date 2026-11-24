"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EstadoError, EstadoVacio } from "@/app/componentes/ui/estado";
import { Icono } from "@/app/componentes/ui/iconos";
import ImagenDisciplina from "@/app/componentes/ui/imagen-disciplina";
import { Insignia } from "@/app/componentes/ui/insignia";
import { useToast } from "@/app/componentes/ui/toast";
import type { EquipamientoApi } from "@/lib/api";
import {
  cancelarReserva,
  crearAlquiler,
  mensajeDeError,
  obtenerCancha,
  obtenerCanchas,
  obtenerEquipamiento,
  obtenerMisReservas,
} from "@/lib/api";
import type {
  CanchaUI,
  FiltroReservaEstado,
  ReservaUI,
} from "@/lib/adaptadores";
import {
  aCanchaUI,
  aMapaNombres,
  aReservasUI,
  filtrarReservasPorEstado,
  limitarCantidad,
  nombreDeItemAlquiler,
  puedeCancelarReserva,
  totalAlquilerPrevisto,
} from "@/lib/adaptadores";
import {
  diaSemana,
  etiquetaFechaRelativa,
  formatearFecha,
  formatearFechaAbreviada,
  obtenerFechaLocalHoy,
} from "@/lib/fechas";
import { formatearMoneda } from "@/lib/formato";

type Pestana = FiltroReservaEstado;

const PESTANAS: Pestana[] = ["Todas", "Confirmadas", "Canceladas"];

type Resultado = {
  clave: number;
  reservas: ReservaUI[];
  canchas: CanchaUI[];
  equipamiento: EquipamientoApi[];
  error: string | null;
};

type AlquilarModal = {
  reserva: ReservaUI;
  disciplinaIds: string[];
  equipamiento: EquipamientoApi[];
  cargandoDisciplinas: boolean;
  marcados: Record<string, boolean>;
  cantidades: Record<string, number>;
  error: string | null;
  enviando: boolean;
};

function InsigniaEstado({ estado }: { estado: ReservaUI["estado"] }) {
  if (estado === "cancelada") {
    return (
      <Insignia tono="rojo">
        <Icono nombre="cerrar" className="h-3.5 w-3.5" />
        Cancelada
      </Insignia>
    );
  }
  return (
    <Insignia tono="verde">
      <Icono nombre="check" className="h-3.5 w-3.5" />
      Confirmada
    </Insignia>
  );
}

export default function ReservasClient() {
  const searchParams = useSearchParams();
  const { mostrarToast } = useToast();
  const hoy = obtenerFechaLocalHoy();
  const reservaCreada = searchParams.get("reserva") === "creada";
  const alquilerConError = searchParams.get("alquiler") === "error";
  const [pestana, setPestana] = useState<Pestana>("Todas");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [intento, setIntento] = useState(0);
  const [filaEnConfirmacion, setFilaEnConfirmacion] = useState<string | null>(
    null,
  );
  const [cancelando, setCancelando] = useState(false);
  const [modalAlquilar, setModalAlquilar] = useState<AlquilarModal | null>(null);

  const clave = intento;
  const cargando = resultado?.clave !== clave;
  const error = resultado?.error ?? null;
  const reservasBase = resultado?.reservas ?? [];
  const canchas = resultado?.canchas ?? [];
  const equipamiento = resultado?.equipamiento ?? [];

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const misReservas = await obtenerMisReservas();
        if (cancelado) return;
        const adaptadas = aReservasUI(misReservas);
        let canchasAdaptadas: CanchaUI[] = [];
        try {
          canchasAdaptadas = (await obtenerCanchas()).map(aCanchaUI);
        } catch {
          canchasAdaptadas = [];
        }
        let catalogo: EquipamientoApi[] = [];
        // El catálogo es solo para mostrar nombres; si falla, se muestra el
        // respaldo y la pantalla no se rompe.
        if (adaptadas.some((reserva) => reserva.alquiler)) {
          try {
            catalogo = await obtenerEquipamiento({ incluirInactivos: true });
          } catch {
            catalogo = [];
          }
        }
        if (cancelado) return;
        setResultado({
          clave,
          reservas: adaptadas,
          canchas: canchasAdaptadas,
          equipamiento: catalogo,
          error: null,
        });
      } catch (e) {
        if (cancelado) return;
        setResultado({
          clave,
          reservas: [],
          canchas: [],
          equipamiento: [],
          error: mensajeDeError(e),
        });
      }
    }
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [clave]);

  const reservasVisibles = filtrarReservasPorEstado(reservasBase, pestana);
  const nombres = aMapaNombres(equipamiento);
  const equipamientoModal = modalAlquilar?.equipamiento ?? [];
  const itemsSeleccionadosModal = equipamientoModal
    .filter((item) => modalAlquilar?.marcados[item.id])
    .map((item) => ({
      equipamientoId: item.id,
      cantidad: modalAlquilar?.cantidades[item.id] ?? 1,
    }));
  const limiteModalInvalido = itemsSeleccionadosModal.some((item) => {
    const stock =
      equipamientoModal.find((eq) => eq.id === item.equipamientoId)
        ?.stockDisponible ?? 0;
    return item.cantidad < 1 || item.cantidad > stock;
  });
  const totalPrevistoModal = totalAlquilerPrevisto(
    itemsSeleccionadosModal,
    equipamientoModal,
  );

  const conteos: Record<Pestana, number> = {
    Todas: reservasBase.length,
    Confirmadas: reservasBase.filter((r) => r.estado === "confirmada").length,
    Canceladas: reservasBase.filter((r) => r.estado === "cancelada").length,
  };

  function disciplinaDeReserva(canchaId: string): string {
    return (
      canchas.find((cancha) => cancha.id === canchaId)?.disciplinas[0]?.nombre ??
      ""
    );
  }

  function elegirPestana(nueva: Pestana) {
    setPestana(nueva);
    setFilaEnConfirmacion(null);
  }

  async function confirmarCancelacion(id: string) {
    if (cancelando) return;
    setCancelando(true);
    try {
      await cancelarReserva(id);
      mostrarToast("Reserva cancelada correctamente.", "exito");
      setFilaEnConfirmacion(null);
      setIntento((n) => n + 1);
    } catch (e) {
      mostrarToast(mensajeDeError(e), "error");
      setFilaEnConfirmacion(null);
      setIntento((n) => n + 1);
    } finally {
      setCancelando(false);
    }
  }

  async function abrirAlquilar(reserva: ReservaUI) {
    setModalAlquilar({
      reserva,
      disciplinaIds: [],
      equipamiento: [],
      cargandoDisciplinas: true,
      marcados: {},
      cantidades: {},
      error: null,
      enviando: false,
    });
    try {
      const cancha = await obtenerCancha(reserva.canchaId);
      const disciplinaIds = cancha.disciplinas.map((d) => d.id);
      const catalogo = await obtenerEquipamiento({ disponible: true });
      setModalAlquilar((prev) =>
        prev?.reserva.id === reserva.id
          ? {
              ...prev,
              disciplinaIds,
              equipamiento: catalogo.filter(
                (item) =>
                  item.activo &&
                  item.stockDisponible > 0 &&
                  disciplinaIds.includes(item.disciplinaId),
              ),
              cargandoDisciplinas: false,
            }
          : prev,
      );
    } catch {
      setModalAlquilar((prev) =>
        prev?.reserva.id === reserva.id
          ? {
              ...prev,
              cargandoDisciplinas: false,
              error: "No se pudo cargar el equipamiento. Intentalo de nuevo.",
            }
          : prev,
      );
    }
  }

  function alternarItemModal(id: string) {
    if (!modalAlquilar) return;
    setModalAlquilar((prev) =>
      prev
        ? {
            ...prev,
            marcados: { ...prev.marcados, [id]: !prev.marcados[id] },
            cantidades:
              prev.cantidades[id] === undefined
                ? { ...prev.cantidades, [id]: 1 }
                : prev.cantidades,
          }
        : prev,
    );
  }

  function cambiarCantidadModal(id: string, valor: string) {
    const cantidad = Math.trunc(Number(valor));
    if (!Number.isFinite(cantidad)) return;
    if (!modalAlquilar) return;
    setModalAlquilar((prev) =>
      prev
        ? { ...prev, cantidades: { ...prev.cantidades, [id]: cantidad } }
        : prev,
    );
  }

  function normalizarCantidadModal(id: string) {
    const stock =
      equipamientoModal.find((item) => item.id === id)?.stockDisponible ?? 0;
    setModalAlquilar((prev) =>
      prev
        ? {
            ...prev,
            cantidades: {
              ...prev.cantidades,
              [id]: limitarCantidad(prev.cantidades[id] ?? 1, stock),
            },
          }
        : prev,
    );
  }

  async function confirmarAlquiler() {
    if (!modalAlquilar || modalAlquilar.enviando) return;
    if (limiteModalInvalido) {
      setModalAlquilar({
        ...modalAlquilar,
        error: "Revisá las cantidades: deben estar entre 1 y el stock disponible.",
      });
      return;
    }
    if (itemsSeleccionadosModal.length === 0) {
      setModalAlquilar({
        ...modalAlquilar,
        error: "Elegí al menos un equipamiento.",
      });
      return;
    }
    setModalAlquilar({ ...modalAlquilar, enviando: true, error: null });
    try {
      await crearAlquiler(modalAlquilar.reserva.id, itemsSeleccionadosModal);
      mostrarToast("Equipamiento alquilado correctamente.", "exito");
      setModalAlquilar(null);
      setIntento((n) => n + 1);
    } catch (e) {
      setModalAlquilar({
        ...modalAlquilar,
        enviando: false,
        error: mensajeDeError(e),
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 sm:py-16">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-secondary">
            <Icono nombre="ticket" className="h-4 w-4" />
            Tus turnos
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
            Mis reservas
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
            Gestioná tus reservas, alquileres y cancelaciones.
          </p>
        </div>
        <Link
          href="/canchas"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-secondary-container" />
          Nueva reserva
        </Link>
      </div>

      {reservaCreada ? (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-secondary/20 bg-secondary-soft px-4 py-3 text-sm text-on-surface"
        >
          <Icono
            nombre={alquilerConError ? "advertencia" : "check"}
            className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
              alquilerConError ? "text-warning" : "text-secondary"
            }`}
          />
          <div>
            <p className="font-semibold">Reserva creada correctamente.</p>
            <p className="mt-0.5 text-on-surface-variant">
              {alquilerConError
                ? "No se pudo alquilar el equipamiento. Podés reintentarlo desde la reserva."
                : "Ya podés verla y gestionarla en esta lista."}
            </p>
          </div>
        </div>
      ) : null}

      {modalAlquilar ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 px-4 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Alquilar equipamiento"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl leading-tight text-primary">
                  Alquilar equipamiento
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {modalAlquilar.reserva.canchaNombre} ·{" "}
                  {formatearFechaAbreviada(modalAlquilar.reserva.fecha)} ·{" "}
                  {modalAlquilar.reserva.hora} a{" "}
                  {modalAlquilar.reserva.horaFin}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAlquilar(null)}
                aria-label="Cerrar"
                className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
              >
                <Icono nombre="cerrar" className="h-5 w-5" />
              </button>
            </div>

            {modalAlquilar.error ? (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-danger/20 bg-danger-container px-4 py-3 text-sm font-medium text-on-danger-container"
              >
                {modalAlquilar.error}
              </div>
            ) : null}

            {modalAlquilar.cargandoDisciplinas ? (
              <div className="mt-5 space-y-3" aria-busy="true">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-2xl bg-surface-container"
                  />
                ))}
              </div>
            ) : equipamientoModal.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">
                No hay equipamiento con stock disponible para esta cancha.
              </p>
            ) : (
              <div
                className="mt-5 space-y-3"
                aria-label="Equipamiento disponible"
              >
                {equipamientoModal.map((item) => {
                  const marcado = modalAlquilar.marcados[item.id] ?? false;
                  const cantidad = modalAlquilar.cantidades[item.id] ?? 1;
                  const fueraDeLimite =
                    marcado &&
                    (cantidad < 1 || cantidad > item.stockDisponible);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition ${
                        marcado
                          ? "border-secondary/40 bg-secondary-soft/40"
                          : "border-outline-variant/50 bg-surface-container-lowest"
                      }`}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => alternarItemModal(item.id)}
                          aria-label={`Elegir ${item.nombre}`}
                          className="mt-1 h-4 w-4 flex-shrink-0 accent-secondary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-on-surface">
                            {item.nombre}
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-variant">
                            {item.stockDisponible} disponibles ·{" "}
                            {formatearMoneda(item.precioUnitario)} c/u
                          </p>
                          {fueraDeLimite ? (
                            <p
                              role="alert"
                              className="mt-1 text-xs font-semibold text-danger"
                            >
                              La cantidad debe estar entre 1 y{" "}
                              {item.stockDisponible}.
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={item.stockDisponible}
                            inputMode="numeric"
                            disabled={!marcado}
                            value={cantidad}
                            onChange={(e) =>
                              cambiarCantidadModal(item.id, e.target.value)
                            }
                            onBlur={() => normalizarCantidadModal(item.id)}
                            aria-label={`Cantidad de ${item.nombre}`}
                            aria-invalid={fueraDeLimite}
                            className="h-8 w-16 rounded-full border border-outline-variant/70 bg-surface-container-lowest px-1 text-center text-sm font-semibold text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 disabled:bg-surface-container-low disabled:text-on-surface-variant"
                          />
                          <span className="w-20 text-right text-sm font-semibold text-on-surface">
                            {marcado
                              ? formatearMoneda(item.precioUnitario * cantidad)
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex items-baseline justify-between border-t border-outline-variant/40 pt-4 text-sm">
              <span className="text-on-surface-variant">
                Total del alquiler previsto
              </span>
              <span
                aria-live="polite"
                className="font-display text-xl font-bold text-primary"
              >
                {formatearMoneda(totalPrevistoModal)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalAlquilar(null)}
                className="rounded-full border border-outline-variant/60 bg-white px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarAlquiler()}
                disabled={
                  modalAlquilar.enviando ||
                  modalAlquilar.cargandoDisciplinas ||
                  limiteModalInvalido
                }
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
              >
                {modalAlquilar.enviando
                  ? "Confirmando..."
                  : "Confirmar alquiler"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-outline-variant/60 bg-surface-container-lowest p-1 sin-scrollbar sm:w-fit">
        {PESTANAS.map((nombre) => {
          const activo = pestana === nombre;
          return (
            <button
              key={nombre}
              type="button"
              onClick={() => elegirPestana(nombre)}
              aria-current={activo ? "page" : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                activo
                  ? "bg-primary text-white"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
              }`}
            >
              {nombre}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold leading-none ${
                  activo
                    ? "bg-white/15 text-secondary-container"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {conteos[nombre]}
              </span>
            </button>
          );
        })}
      </div>

      {cargando ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="grid overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest sm:grid-cols-[11rem_minmax(0,1fr)]"
            >
              <div className="h-32 animate-pulse bg-surface-container sm:h-full" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-40 animate-pulse rounded bg-surface-container" />
                <div className="h-4 w-56 animate-pulse rounded bg-surface-container" />
                <div className="h-4 w-32 animate-pulse rounded bg-surface-container" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EstadoError
          mensaje={error}
          onReintentar={() => setIntento((n) => n + 1)}
        />
      ) : reservasVisibles.length === 0 ? (
        <EstadoVacio
          titulo="No tenés reservas en esta pestaña"
          descripcion="Cuando reserves una cancha, tu turno va a aparecer acá con su fecha y equipamiento."
          accion={
            <Link
              href="/canchas"
              className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary"
            >
              Reservar una cancha
            </Link>
          }
          icono="calendario"
        />
      ) : (
        <div className="space-y-4">
          {reservasVisibles.map((reserva) => {
            const puede = puedeCancelarReserva(reserva, new Date());
            const confirmando = filaEnConfirmacion === reserva.id;
            const puedeAlquilar =
              reserva.estado === "confirmada" && reserva.alquiler === null;
            const disciplina = disciplinaDeReserva(reserva.canchaId);
            const fechaLegible = `${etiquetaFechaRelativa(reserva.fecha, hoy)} · ${reserva.hora} a ${reserva.horaFin} hs`;
            const numeroDia = reserva.fecha.split("-")[2] ?? "--";
            const cancelada = reserva.estado === "cancelada";
            const codigo = `#${reserva.id.slice(0, 6).toUpperCase()}`;

            return (
              <article
                key={reserva.id}
                className="overflow-hidden rounded-[1.75rem] border border-outline-variant/60 bg-surface-container-lowest shadow-[0_1px_2px_rgba(16,25,17,0.04),0_20px_50px_-38px_rgba(16,25,17,0.42)]"
              >
                <div className="grid sm:grid-cols-[11rem_minmax(0,1fr)]">
                  <div
                    className={`relative flex flex-col justify-between gap-3 p-4 sm:p-5 ${
                      cancelada
                        ? "bg-surface-container text-on-surface-variant"
                        : "bg-primary text-white"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="muesca-boleto -right-[0.55rem] top-4"
                    />
                    <span
                      aria-hidden="true"
                      className="muesca-boleto -right-[0.55rem] bottom-4"
                    />

                    <div className="flex items-center justify-between gap-2 sm:block">
                      <p
                        className={`text-[0.6rem] font-bold uppercase tracking-[0.18em] ${
                          cancelada ? "text-on-surface-variant" : "text-white/45"
                        }`}
                      >
                        Turno
                      </p>
                      <div className="sm:mt-2">
                        <InsigniaEstado estado={reserva.estado} />
                      </div>
                    </div>

                    <div className="flex items-end gap-4 sm:block">
                      <p className="font-display text-5xl font-bold leading-none">
                        {numeroDia}
                      </p>
                      <div className="sm:mt-1">
                        <p className="text-xs font-semibold capitalize">
                          {diaSemana(reserva.fecha)}
                        </p>
                        <p
                          className={`text-[0.7rem] ${
                            cancelada ? "text-on-surface-variant" : "text-white/55"
                          }`}
                        >
                          {formatearFecha(reserva.fecha)}
                        </p>
                      </div>
                      <p className="ml-auto whitespace-nowrap font-display text-2xl font-bold leading-none sm:ml-0 sm:mt-3">
                        {reserva.hora}
                        <span
                          className={`text-sm font-semibold ${
                            cancelada ? "text-on-surface-variant" : "text-secondary-container"
                          }`}
                        >
                          {" "}
                          – {reserva.horaFin}
                        </span>
                      </p>
                    </div>

                    <p
                      className={`text-[0.65rem] font-semibold tracking-[0.16em] ${
                        cancelada ? "text-on-surface-variant" : "text-white/45"
                      }`}
                    >
                      {codigo}
                    </p>
                  </div>

                  <div className="min-w-0 p-5">
                    <div className="flex items-start gap-3">
                      <ImagenDisciplina
                        disciplina={disciplina}
                        alt={`Cancha de ${disciplina || reserva.canchaNombre}`}
                        className={`h-12 w-12 flex-shrink-0 rounded-xl ${
                          cancelada ? "grayscale" : ""
                        }`}
                        sizes="48px"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-display text-2xl font-bold leading-tight text-on-surface">
                            {reserva.canchaNombre}
                          </h2>
                          <Insignia tono="neutro">
                            <Icono
                              nombre="calendario"
                              className="h-3.5 w-3.5"
                            />
                            {etiquetaFechaRelativa(reserva.fecha, hoy)}
                          </Insignia>
                        </div>
                        <p className="mt-1 text-sm font-medium capitalize text-secondary">
                          {fechaLegible}
                        </p>
                      </div>
                    </div>

                    {reserva.alquiler &&
                    reserva.alquiler.items.length > 0 ? (
                      <div className="mt-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-3">
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                          Equipamiento alquilado
                        </p>
                        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-on-surface">
                          {reserva.alquiler.items.map((item) => (
                            <li key={item.equipamientoId}>
                              {item.cantidad}{" "}
                              {nombreDeItemAlquiler(item, nombres)}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-sm font-bold text-primary">
                          Total:{" "}
                          {formatearMoneda(reserva.alquiler.total)}
                        </p>
                      </div>
                    ) : null}

                    {confirmando ? (
                      <div className="mt-4 rounded-2xl border border-danger/20 bg-danger-container px-4 py-3">
                        <p className="text-sm font-semibold text-on-danger-container">
                          ¿Cancelar esta reserva?
                        </p>
                        <p className="mt-0.5 text-xs text-on-danger-container/80">
                          El turno y el equipamiento vuelven a quedar
                          disponibles.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={cancelando}
                            onClick={() =>
                              void confirmarCancelacion(reserva.id)
                            }
                            className="rounded-full bg-danger px-4 py-2 text-xs font-semibold text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
                          >
                            {cancelando ? "Cancelando..." : "Sí, cancelar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilaEnConfirmacion(null)}
                            className="rounded-full border border-danger/20 bg-white px-4 py-2 text-xs font-semibold text-on-danger-container transition hover:bg-white/80"
                          >
                            No, volver
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {puedeAlquilar ? (
                          <button
                            type="button"
                            onClick={() => void abrirAlquilar(reserva)}
                            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/60 bg-white px-4 py-2 text-xs font-semibold text-on-surface transition hover:border-secondary/40 hover:text-secondary"
                          >
                            <Icono
                              nombre="equipamiento"
                              className="h-4 w-4"
                            />
                            Alquilar equipamiento
                          </button>
                        ) : null}
                        {reserva.estado === "confirmada" ? (
                          <button
                            type="button"
                            disabled={!puede}
                            title={
                              puede
                                ? undefined
                                : "Solo se puede cancelar hasta 2 horas antes del turno."
                            }
                            onClick={() =>
                              setFilaEnConfirmacion(reserva.id)
                            }
                            className="rounded-full border border-danger/20 bg-white px-4 py-2 text-xs font-semibold text-danger transition hover:bg-danger-container disabled:cursor-not-allowed disabled:border-outline-variant/40 disabled:bg-surface-container-low disabled:text-on-surface-variant"
                          >
                            Cancelar reserva
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-on-surface-variant">
        <Icono
          nombre="informacion"
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
        />
        <span>
          Se puede cancelar hasta 2 horas antes del turno. El equipamiento
          alquilado vuelve al stock al cancelar.
        </span>
      </p>
    </div>
  );
}
