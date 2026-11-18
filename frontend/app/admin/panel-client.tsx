"use client";

import { useEffect, useState } from "react";

import type { CanchaUI, EquipamientoUI, ReservaUI } from "@/lib/adaptadores";
import {
  aCanchaUI,
  aEquipamientoUI,
  aReservasUI,
  contarCanchasActivas,
  contarPocoStock,
  reservasDeHoy,
} from "@/lib/adaptadores";
import type { DisciplinaApi, ReservaApi } from "@/lib/api";
import {
  mensajeDeErrorAdmin,
  obtenerCanchas,
  obtenerDisciplinas,
  obtenerEquipamiento,
  obtenerMisReservas,
} from "@/lib/api";
import { obtenerFechaLocalHoy } from "@/lib/fechas";

import TarjetaCanchas from "./tarjeta-canchas";
import TarjetaEquipamiento from "./tarjeta-equipamiento";
import TarjetaIndicador from "./tarjeta-indicador";
import TarjetaReservasHoy from "./tarjeta-reservas-hoy";

type Resultado = {
  clave: number;
  canchas: CanchaUI[];
  disciplinas: DisciplinaApi[];
  equipamiento: EquipamientoUI[];
  reservasHoy: ReservaUI[];
  error: string | null;
};

function reservasConfirmadasDeHoy(
  reservas: ReservaApi[],
  hoy: string,
): ReservaUI[] {
  return aReservasUI(reservasDeHoy(reservas, hoy)).sort((a, b) =>
    a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0,
  );
}

export default function PanelClient() {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [reintento, setReintento] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargando = resultado?.clave !== reintento;
  const error = resultado?.error ?? null;
  const canchas = resultado?.canchas ?? [];
  const disciplinas = resultado?.disciplinas ?? [];
  const equipamiento = resultado?.equipamiento ?? [];
  const reservasHoy = resultado?.reservasHoy ?? [];

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const [canchasApi, listaDisciplinas, equipamientoApi, reservas] =
          await Promise.all([
            obtenerCanchas(),
            obtenerDisciplinas(),
            obtenerEquipamiento(),
            obtenerMisReservas(),
          ]);
        if (cancelado) return;
        const hoy = obtenerFechaLocalHoy();
        setResultado({
          clave: reintento,
          canchas: canchasApi.map(aCanchaUI),
          disciplinas: listaDisciplinas,
          equipamiento: equipamientoApi.map(aEquipamientoUI),
          reservasHoy: reservasConfirmadasDeHoy(reservas, hoy),
          error: null,
        });
      } catch (e) {
        if (cancelado) return;
        setResultado({
          clave: reintento,
          canchas: [],
          disciplinas: [],
          equipamiento: [],
          reservasHoy: [],
          error: mensajeDeErrorAdmin(e),
        });
      }
    }

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [reintento]);

  function recargar() {
    setReintento((n) => n + 1);
  }

  async function recargarCanchas() {
    try {
      const canchasApi = await obtenerCanchas();
      setResultado((prev) =>
        prev ? { ...prev, canchas: canchasApi.map(aCanchaUI) } : prev,
      );
      setAviso(null);
    } catch (e) {
      setAviso(mensajeDeErrorAdmin(e));
    }
  }

  async function recargarEquipamiento() {
    try {
      const equipamientoApi = await obtenerEquipamiento();
      setResultado((prev) =>
        prev
          ? { ...prev, equipamiento: equipamientoApi.map(aEquipamientoUI) }
          : prev,
      );
      setAviso(null);
    } catch (e) {
      setAviso(mensajeDeErrorAdmin(e));
    }
  }

  if (cargando) {
    return <p className="text-sm text-slate-500">Cargando panel...</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={recargar}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const canchasActivas = contarCanchasActivas(canchas);
  const equipamientoPocoStock = contarPocoStock(equipamiento);

  return (
    <div className="flex flex-col gap-4">
      {aviso ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50 p-3 text-sm text-red-600"
        >
          No se pudieron actualizar los datos. {aviso}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaIndicador
          etiqueta="Reservas de hoy"
          valor={reservasHoy.length}
        />
        <TarjetaIndicador etiqueta="Canchas activas" valor={canchasActivas} />
        <TarjetaIndicador
          etiqueta="Equipamiento con poco stock"
          valor={equipamientoPocoStock}
        />
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[62fr_38fr]">
        <TarjetaCanchas
          canchas={canchas}
          disciplinas={disciplinas}
          onCanchasCambiadas={() => void recargarCanchas()}
        />

        <div className="flex flex-col gap-4">
          <TarjetaEquipamiento
            equipamiento={equipamiento}
            disciplinas={disciplinas}
            onEquipamientoCambiado={() => void recargarEquipamiento()}
          />
          <TarjetaReservasHoy reservas={reservasHoy} />
        </div>
      </div>
    </div>
  );
}
