"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  aMapaNombres,
  textoItemsAlquiler,
} from "@/lib/adaptadores";
import { diaSemana, formatearFecha } from "@/lib/fechas";

type Resultado = {
  clave: string;
  cancha: CanchaUI | null;
  horaFin: string;
  equipamiento: EquipamientoApi[];
  turnoDisponible: boolean;
  error: string | null;
};

const MENSAJE_TURNO_OCUPADO = "Ese turno ya no está disponible.";

export default function ReservarClient({ canchaId }: { canchaId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const fecha = searchParams.get("fecha") ?? "";
  const hora = searchParams.get("hora") ?? "";
  const turnoId = searchParams.get("turnoId") ?? "";

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [intento, setIntento] = useState(0);
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorTurno, setErrorTurno] = useState(false);

  const clave = `${canchaId}|${turnoId}|${fecha}|${intento}`;
  const cargando = resultado?.clave !== clave;
  const error = resultado?.error ?? null;
  const cancha = resultado?.cancha ?? null;
  const horaFin = resultado?.horaFin ?? hora;
  const equipamiento = resultado?.equipamiento ?? [];

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
        if (cancelado) return;
        setResultado({
          clave,
          cancha: aCanchaUI(canchaObtenida),
          horaFin: turno.hora_fin.slice(0, 5),
          equipamiento: items.filter((item) => item.activo && item.stockDisponible > 0),
          turnoDisponible: turno.disponible,
          error: null,
        });
      } catch (e) {
        if (cancelado) return;
        setResultado({
          clave,
          cancha: null,
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

  function alternarEquipamiento(id: string) {
    setMarcados((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function cambiarCantidad(id: string, valor: string) {
    const cantidad = Math.trunc(Number(valor));
    if (Number.isNaN(cantidad)) return;
    // Sin límite silencioso: el límite se valida y se muestra (spec "Cantidad fuera de límites").
    setCantidades((prev) => ({ ...prev, [id]: cantidad }));
  }

  const seleccionados = equipamiento
    .filter((item) => marcados[item.id])
    .map((item) => ({
      equipamientoId: item.id,
      cantidad: cantidades[item.id] ?? 1,
    }));
  const cantidadesInvalidas = seleccionados
    .filter((item) => {
      const stock = equipamiento.find((eq) => eq.id === item.equipamientoId)
        ?.stockDisponible;
      return stock !== undefined && (item.cantidad < 1 || item.cantidad > stock);
    });
  const limiteInvalido = cantidadesInvalidas.length > 0;
  const nombres: Record<string, string> = aMapaNombres(equipamiento);
  const detalleEquipamiento =
    seleccionados.length > 0
      ? textoItemsAlquiler(seleccionados, nombres)
      : "Sin equipamiento";
  const totalPrevisto = seleccionados.reduce((total, item) => {
    const itemCatalogo = equipamiento.find(
      (eq) => eq.id === item.equipamientoId,
    );
    return total + (itemCatalogo?.precioUnitario ?? 0) * item.cantidad;
  }, 0);

  async function confirmarReserva() {
    if (enviando) return;
    setEnviando(true);
    setErrorTurno(false);
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
        // El turno dejó de estar libre: se vuelve a pedir la información (y las franjas).
        setErrorTurno(true);
        setIntento((n) => n + 1);
        return;
      }
      setResultado({
        clave,
        cancha: null,
        horaFin: "",
        equipamiento: [],
        turnoDisponible: false,
        error: mensajeDeError(e),
      });
    }
  }

  if (!turnoId || !fecha || !hora) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900">
          Confirmar reserva
        </h1>
        <p className="mb-4 text-slate-600">
          No encontramos el turno elegido.
        </p>
        <Link
          href="/canchas"
          className="inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Cambiar turno
        </Link>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[62fr_38fr]">
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!cargando && error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900">
          Confirmar reserva
        </h1>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => setIntento((n) => n + 1)}
            className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!cargando && !cancha) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900">
          Confirmar reserva
        </h1>
        <p className="mb-4 text-slate-600">No encontramos el turno elegido.</p>
        <Link
          href="/canchas"
          className="inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Cambiar turno
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link
          href="/canchas"
          className="underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Canchas
        </Link>
        <span aria-hidden="true">&gt;</span>
        <span>{cancha?.nombre}</span>
        <span aria-hidden="true">&gt;</span>
        <span className="text-slate-900">Reservar</span>
      </nav>

      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900">
        Confirmar reserva
      </h1>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[62fr_38fr]">
        <div className="flex flex-col gap-4">
          {(errorTurno || resultado?.turnoDisponible === false) && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
            >
              <span>{MENSAJE_TURNO_OCUPADO}</span>
              <Link
                href="/canchas"
                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
              >
                Ver franjas disponibles
              </Link>
            </div>
          )}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Turno seleccionado
            </h2>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900">{cancha?.nombre}</p>
                <p className="mt-1 text-sm text-slate-700">
                  {diaSemana(fecha)} {formatearFecha(fecha)} · {hora} a {horaFin}{" "}
                  hs
                </p>
              </div>
              <Link
                href="/canchas"
                className="shrink-0 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Cambiar turno
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Equipamiento (opcional)
            </h2>
            <div>
              {equipamiento.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay equipamiento disponible para este turno.
                </p>
              ) : (
                equipamiento.map((item, indice) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 py-3 ${
                      indice > 0 ? "border-t border-slate-200/80" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`equipamiento-${item.id}`}
                      checked={marcados[item.id] ?? false}
                      onChange={() => alternarEquipamiento(item.id)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <label
                      htmlFor={`equipamiento-${item.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="block text-sm font-medium text-slate-900">
                        {item.nombre}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {item.stockDisponible} disponibles · ${" "}
                        {item.precioUnitario} c/u
                      </span>
                      {marcados[item.id] &&
                      ((cantidades[item.id] ?? 1) < 1 ||
                        (cantidades[item.id] ?? 1) > item.stockDisponible) ? (
                        <span className="block text-xs font-medium text-red-600">
                          La cantidad debe estar entre 1 y {item.stockDisponible}.
                        </span>
                      ) : null}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={item.stockDisponible}
                      disabled={!marcados[item.id]}
                      value={cantidades[item.id] ?? 1}
                      onChange={(e) => cambiarCantidad(item.id, e.target.value)}
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-right text-sm disabled:bg-slate-50"
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resumen
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">Cancha</dt>
                <dd className="text-right font-medium text-slate-900">
                  {cancha?.nombre}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">Fecha</dt>
                <dd className="text-right font-medium text-slate-900">
                  {formatearFecha(fecha)}, {hora} a {horaFin} hs
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">Equipamiento</dt>
                <dd className="text-right font-medium text-slate-900">
                  {detalleEquipamiento}
                </dd>
              </div>
              {seleccionados.length > 0 && (
                <div className="flex items-start justify-between gap-3 border-t border-slate-200/80 pt-2">
                  <dt className="text-slate-500">Total del alquiler (previsto)</dt>
                  <dd className="text-right font-bold text-slate-900">
                    $ {totalPrevisto}
                  </dd>
                </div>
              )}
            </dl>
            <button
              type="button"
              onClick={() => void confirmarReserva()}
              disabled={
                enviando ||
                limiteInvalido ||
                resultado?.turnoDisponible === false
              }
              className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-medium ${
                enviando
                  ? "cursor-not-allowed bg-slate-300 text-white"
                  : "bg-emerald-600 text-white transition-all duration-200 hover:bg-emerald-700"
              }`}
            >
              {enviando ? "Confirmando..." : "Confirmar reserva"}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">
              Podés cancelar hasta 2 horas antes del turno
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


