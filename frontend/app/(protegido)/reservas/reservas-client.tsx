"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { EquipamientoApi } from "@/lib/api";
import {
  cancelarReserva,
  crearAlquiler,
  mensajeDeError,
  obtenerCancha,
  obtenerEquipamiento,
  obtenerMisReservas,
} from "@/lib/api";
import type { FiltroReservaEstado, ReservaUI } from "@/lib/adaptadores";
import {
  aMapaNombres,
  aReservasUI,
  filtrarReservasPorEstado,
  nombreDeItemAlquiler,
  puedeCancelarReserva,
} from "@/lib/adaptadores";
import { formatearFechaAbreviada } from "@/lib/fechas";

type Pestana = FiltroReservaEstado;

const PESTANAS: Pestana[] = ["Todas", "Confirmadas", "Canceladas"];

type Resultado = {
  clave: number;
  reservas: ReservaUI[];
  equipamiento: EquipamientoApi[];
  error: string | null;
};

type AlquilarModal = {
  reserva: ReservaUI;
  disciplinaIds: string[];
  cargandoDisciplinas: boolean;
  marcados: Record<string, boolean>;
  cantidades: Record<string, number>;
  error: string | null;
  enviando: boolean;
};

function InsigniaEstado({ estado }: { estado: ReservaUI["estado"] }) {
  if (estado === "cancelada") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/70">
        Cancelada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
      Confirmada
    </span>
  );
}

export default function ReservasClient() {
  const searchParams = useSearchParams();
  const reservaCreada = searchParams.get("reserva") === "creada";
  const alquilerConError = searchParams.get("alquiler") === "error";
  const [pestana, setPestana] = useState<Pestana>("Todas");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [intento, setIntento] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [filaEnConfirmacion, setFilaEnConfirmacion] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [modalAlquilar, setModalAlquilar] = useState<AlquilarModal | null>(null);

  const clave = intento;
  const cargando = resultado?.clave !== clave;
  const error = resultado?.error ?? null;
  const reservasBase = resultado?.reservas ?? [];
  const equipamiento = resultado?.equipamiento ?? [];

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const misReservas = await obtenerMisReservas();
        if (cancelado) return;
        const adaptadas = aReservasUI(misReservas);
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
          equipamiento: catalogo,
          error: null,
        });
      } catch (e) {
        if (cancelado) return;
        setResultado({
          clave,
          reservas: [],
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
  const equipamientoModal = modalAlquilar
    ? equipamiento.filter(
        (item) =>
          item.activo &&
          item.stockDisponible > 0 &&
          modalAlquilar.disciplinaIds.includes(item.disciplinaId),
      )
    : [];

  function elegirPestana(nueva: Pestana) {
    setPestana(nueva);
    setFilaEnConfirmacion(null);
  }

  async function confirmarCancelacion(id: string) {
    if (cancelando) return;
    setCancelando(true);
    setAviso(null);
    try {
      await cancelarReserva(id);
      setFilaEnConfirmacion(null);
      setIntento((n) => n + 1);
    } catch (e) {
      setAviso(mensajeDeError(e));
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
      cargandoDisciplinas: true,
      marcados: {},
      cantidades: {},
      error: null,
      enviando: false,
    });
    try {
      const cancha = await obtenerCancha(reserva.canchaId);
      // Se compara contra el estado actual (prev): el modal pudo cerrarse o
      // cambiar de reserva mientras esperábamos la respuesta.
      setModalAlquilar((prev) =>
        prev?.reserva.id === reserva.id
          ? {
              ...prev,
              disciplinaIds: cancha.disciplinas.map((d) => d.id),
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
      prev ? { ...prev, marcados: { ...prev.marcados, [id]: !prev.marcados[id] } } : prev,
    );
  }

  function cambiarCantidadModal(id: string, valor: string) {
    const cantidad = Math.trunc(Number(valor));
    if (Number.isNaN(cantidad)) return;
    if (!modalAlquilar) return;
    setModalAlquilar((prev) =>
      prev ? { ...prev, cantidades: { ...prev.cantidades, [id]: cantidad } } : prev,
    );
  }

  async function confirmarAlquiler() {
    if (!modalAlquilar || modalAlquilar.enviando) return;
    const items = equipamientoModal
      .filter((item) => modalAlquilar.marcados[item.id])
      .map((item) => ({
        equipamientoId: item.id,
        cantidad: modalAlquilar.cantidades[item.id] ?? 1,
      }));
    const fueraDeLimite = items.some((item) => {
      const stock = equipamientoModal.find((eq) => eq.id === item.equipamientoId)
        ?.stockDisponible;
      return stock !== undefined && (item.cantidad < 1 || item.cantidad > stock);
    });
    if (fueraDeLimite) {
      setModalAlquilar({ ...modalAlquilar, error: "Revisá las cantidades: deben estar entre 1 y el stock disponible." });
      return;
    }
    if (items.length === 0) {
      setModalAlquilar({ ...modalAlquilar, error: "Elegí al menos un equipamiento." });
      return;
    }
    setModalAlquilar({ ...modalAlquilar, enviando: true, error: null });
    try {
      await crearAlquiler(modalAlquilar.reserva.id, items);
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

  const totalPrevistoModal = equipamientoModal.reduce((total, item) => {
    if (!modalAlquilar?.marcados[item.id]) return total;
    return total + item.precioUnitario * (modalAlquilar.cantidades[item.id] ?? 1);
  }, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Mis reservas</h1>
          <p className="mt-1 text-sm text-slate-600">Gestioná tus turnos y alquileres</p>
        </div>
        <Link
          href="/canchas"
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          Nueva reserva
        </Link>
      </div>

      {reservaCreada && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <p className="font-medium">Reserva creada correctamente.</p>
          <p className="mt-0.5 text-emerald-800">
            {alquilerConError
              ? "No se pudo alquilar el equipamiento. Podés reintentarlo desde la reserva."
              : "Ya podés verla y gestionarla en esta lista."}
          </p>
        </div>
      )}

      {aviso && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <span className="flex-1">{aviso}</span>
          <button
            type="button"
            onClick={() => setAviso(null)}
            className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-50"
          >
            Cerrar
          </button>
        </div>
      )}

      {modalAlquilar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-label="Alquilar equipamiento"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-7"
          >
            <div className="mb-1 text-lg font-semibold tracking-tight text-slate-900">
              Alquilar equipamiento
            </div>
            <p className="mb-5 text-sm text-slate-500">
              {modalAlquilar.reserva.canchaNombre} ·{" "}
              {formatearFechaAbreviada(modalAlquilar.reserva.fecha)} ·{" "}
              {modalAlquilar.reserva.hora} a {modalAlquilar.reserva.horaFin}
            </p>
            {modalAlquilar.error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {modalAlquilar.error}
              </div>
            )}
            {modalAlquilar.cargandoDisciplinas ? (
              <p className="mb-4 text-sm text-slate-500">
                Cargando equipamiento...
              </p>
            ) : equipamientoModal.length === 0 ? (
              <p className="mb-4 text-sm text-slate-500">
                No hay equipamiento con stock disponible para esta cancha.
              </p>
            ) : (
              <div className="mb-5" aria-label="Equipamiento disponible">
                {equipamientoModal.map((item, indice) => {
                  const marcado = modalAlquilar.marcados[item.id] ?? false;
                  const cantidad = modalAlquilar.cantidades[item.id] ?? 1;
                  const fueraDeLimite = cantidad < 1 || cantidad > item.stockDisponible;
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap ${
                        indice > 0 ? "border-t border-slate-100" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => alternarItemModal(item.id)}
                        aria-label={`Elegir ${item.nombre}`}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      <div className="min-w-[140px] flex-1">
                        <span className="block text-sm font-medium text-slate-900">
                          {item.nombre}
                        </span>
                        <span className="block text-xs text-slate-500">
                          Stock disponible: {item.stockDisponible}
                        </span>
                        {marcado && fueraDeLimite ? (
                          <span className="block text-xs font-medium text-red-600">
                            La cantidad debe estar entre 1 y {item.stockDisponible}.
                          </span>
                        ) : null}
                      </div>
                      <span className="w-24 text-right text-sm text-slate-600">
                        $ {item.precioUnitario}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={item.stockDisponible}
                        disabled={!marcado}
                        value={cantidad}
                        onChange={(e) => cambiarCantidadModal(item.id, e.target.value)}
                        aria-label={`Cantidad de ${item.nombre}`}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                      <span className="w-20 text-right text-sm font-medium text-slate-700">
                        {marcado && !fueraDeLimite
                          ? `$ ${item.precioUnitario * cantidad}`
                          : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mb-5 flex items-baseline justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-slate-900">
              <span>Total del alquiler (previsto)</span>
              <span>$ {totalPrevistoModal}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalAlquilar(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarAlquiler()}
                disabled={
                  modalAlquilar.enviando ||
                  modalAlquilar.cargandoDisciplinas
                }
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  modalAlquilar.enviando || modalAlquilar.cargandoDisciplinas
                    ? "cursor-not-allowed bg-slate-300 text-white"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                Confirmar alquiler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 border-b border-slate-200/70">
        <nav className="flex gap-2" aria-label="Filtrar por estado">
          {PESTANAS.map((nombre) => (
            <button
              key={nombre}
              type="button"
              onClick={() => elegirPestana(nombre)}
              aria-current={pestana === nombre ? "page" : undefined}
              className={`-mb-px rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
                pestana === nombre
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {nombre}
            </button>
          ))}
        </nav>
      </div>

      {cargando ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-2xl border border-slate-200/80 bg-white"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => setIntento((n) => n + 1)}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Reintentar
          </button>
        </div>
      ) : reservasVisibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <p className="text-sm text-slate-500">
            No tenés reservas en esta pestaña.
          </p>
          <Link
            href="/canchas"
            className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Reservar una cancha
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Cancha</th>
                  <th className="px-5 py-3.5">Fecha y horario</th>
                  <th className="px-5 py-3.5">Equipamiento alquilado</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservasVisibles.map((reserva) => {
                  const puede = puedeCancelarReserva(reserva, new Date());
                  const confirmando = filaEnConfirmacion === reserva.id;
                  const puedeAlquilar =
                    reserva.estado === "confirmada" && reserva.alquiler === null;

                  return (
                    <tr
                      key={reserva.id}
                      className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
                          >
                            {reserva.canchaNombre.charAt(0)}
                          </span>
                          <p className="font-semibold text-slate-900">
                            {reserva.canchaNombre}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {formatearFechaAbreviada(reserva.fecha)} · {reserva.hora}{" "}
                        a {reserva.horaFin}
                      </td>
                      <td className="px-5 py-4">
                        {reserva.alquiler && reserva.alquiler.items.length > 0 ? (
                          <div className="flex flex-col gap-1 text-slate-700">
                            {reserva.alquiler.items.map((item) => (
                              <span key={item.equipamientoId} className="text-sm">
                                {item.cantidad} {nombreDeItemAlquiler(item, nombres)}
                              </span>
                            ))}
                            <span className="text-sm font-semibold text-slate-900">
                              Total: $ {reserva.alquiler.total.toLocaleString("es-AR")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Sin equipamiento</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <InsigniaEstado estado={reserva.estado} />
                      </td>
                      <td className="px-5 py-4">
                        {confirmando ? (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <span className="text-sm text-slate-700">
                              ¿Cancelar esta reserva?
                            </span>
                            <button
                              type="button"
                              disabled={cancelando}
                              onClick={() => void confirmarCancelacion(reserva.id)}
                              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                                cancelando
                                  ? "cursor-not-allowed bg-slate-300 text-white"
                                  : "bg-slate-900 text-white hover:bg-slate-800"
                              }`}
                            >
                              Sí, cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilaEnConfirmacion(null)}
                              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {puedeAlquilar && (
                              <button
                                type="button"
                                onClick={() => abrirAlquilar(reserva)}
                                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                Alquilar equipamiento
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!puede}
                              onClick={() => setFilaEnConfirmacion(reserva.id)}
                              className={`rounded-xl border px-3.5 py-1.5 text-sm font-medium transition ${
                                puede
                                  ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                                  : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                              }`}
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs text-slate-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>
          Se puede cancelar hasta 2 horas antes del turno. El equipamiento
          alquilado vuelve al stock al cancelar.
        </span>
      </p>
    </div>
  );
}
