"use client";

import { useState } from "react";

import { obtenerFechaLocalHoy } from "@/lib/fechas";
import type { Cancha, Equipamiento, Reserva } from "@/lib/mock-reservas";
import {
  obtenerEquipamiento,
  obtenerReservas,
  obtenerTodasLasCanchas,
  UMBRAL_POCO_STOCK,
} from "@/lib/mock-reservas";

import TarjetaCanchas from "./tarjeta-canchas";
import TarjetaEquipamiento from "./tarjeta-equipamiento";
import TarjetaIndicador from "./tarjeta-indicador";
import TarjetaReservasHoy from "./tarjeta-reservas-hoy";

/** Reservas confirmadas o pendientes de hoy, ordenadas por hora. */
function reservasDeHoy(): Reserva[] {
  const hoy = obtenerFechaLocalHoy();
  return obtenerReservas()
    .filter(
      (reserva) =>
        reserva.fecha === hoy &&
        (reserva.estado === "confirmada" || reserva.estado === "pendiente")
    )
    .sort((a, b) => (a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0));
}

export default function PanelClient() {
  const [canchas, setCanchas] = useState<Cancha[]>(() =>
    obtenerTodasLasCanchas()
  );
  const [equipamiento, setEquipamiento] = useState<Equipamiento[]>(() =>
    obtenerEquipamiento()
  );

  const reservasHoy = reservasDeHoy();
  const canchasActivas = canchas.filter((cancha) => cancha.activa).length;
  const equipamientoPocoStock = equipamiento.filter(
    (item) => item.stockTotal <= UMBRAL_POCO_STOCK
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaIndicador etiqueta="Reservas de hoy" valor={reservasHoy.length} />
        <TarjetaIndicador etiqueta="Canchas activas" valor={canchasActivas} />
        <TarjetaIndicador
          etiqueta="Equipamiento con poco stock"
          valor={equipamientoPocoStock}
        />
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[62fr_38fr]">
        <TarjetaCanchas
          canchas={canchas}
          onCanchasCambiadas={() => setCanchas(obtenerTodasLasCanchas())}
        />

        <div className="flex flex-col gap-4">
          <TarjetaEquipamiento
            equipamiento={equipamiento}
            onEquipamientoCambiado={() => setEquipamiento(obtenerEquipamiento())}
          />
          <TarjetaReservasHoy reservas={reservasHoy} />
        </div>
      </div>
    </div>
  );
}