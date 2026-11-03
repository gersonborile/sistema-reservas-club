import { describe, expect, it } from "vitest";

import type { EquipamientoApi, ReservaApi } from "@/lib/api";
import {
  aReservaUI,
  aMapaNombres,
  obtenerProximaReserva,
  puedeCancelarReserva,
  textoItemsAlquiler,
} from "@/lib/adaptadores";
import type { ReservaUI } from "@/lib/adaptadores";

const CON_TURNO_Y_SIN_ALQUILER: ReservaApi = {
  id: "r-1",
  usuarioId: "u-1",
  turnoId: "t-1",
  estado: "CONFIRMADA",
  createdAt: "2026-11-01T10:00:00.000Z",
  alquiler: null,
  turno: {
    fecha: "2026-11-05",
    horaInicio: "18:00",
    horaFin: "19:00",
    cancha: { id: "c-2", nombre: "Cancha 2" },
  },
};

describe("aReservaUI", () => {
  it("mapea cancha, fecha y hora desde el turno", () => {
    const reserva = aReservaUI(CON_TURNO_Y_SIN_ALQUILER);

    expect(reserva).toEqual({
      id: "r-1",
      usuarioId: "u-1",
      canchaId: "c-2",
      canchaNombre: "Cancha 2",
      fecha: "2026-11-05",
      hora: "18:00",
      horaFin: "19:00",
      estado: "confirmada",
      alquiler: null,
    });
  });

  it("traduce CONFIRMADA a confirmada", () => {
    expect(aReservaUI(CON_TURNO_Y_SIN_ALQUILER).estado).toBe("confirmada");
  });

  it("traduce CANCELADA a cancelada", () => {
    const cancelada: ReservaApi = {
      ...CON_TURNO_Y_SIN_ALQUILER,
      estado: "CANCELADA",
    };
    expect(aReservaUI(cancelada).estado).toBe("cancelada");
  });

  it("incluye el alquiler con items y total del backend", () => {
    const conAlquiler: ReservaApi = {
      ...CON_TURNO_Y_SIN_ALQUILER,
      alquiler: {
        id: "alq-1",
        total: 3000,
        items: [{ equipamientoId: "eq-1", cantidad: 2, precioUnitario: 1500 }],
      },
    };

    expect(aReservaUI(conAlquiler).alquiler).toEqual({
      id: "alq-1",
      total: 3000,
      items: [{ equipamientoId: "eq-1", cantidad: 2, precioUnitario: 1500 }],
    });
  });
});

const AHORA = new Date(2026, 10, 3, 15, 0);

function reservaDeUI(
  id: string,
  fecha: string,
  hora: string,
  estado: ReservaUI["estado"],
  usuarioId = "u-1",
): ReservaUI {
  return {
    id,
    usuarioId,
    canchaId: "c-1",
    canchaNombre: "Cancha 1",
    fecha,
    hora,
    horaFin: "19:00",
    estado,
    alquiler: null,
  };
}

const CONFIRMADA_16 = reservaDeUI("r-3", "2026-11-03", "16:00", "confirmada");
const CONFIRMADA_18 = reservaDeUI("r-4", "2026-11-03", "18:00", "confirmada");
const CONFIRMADA_AYER = reservaDeUI("r-5", "2026-11-02", "16:00", "confirmada");
const CONFIRMADA_PASADA = reservaDeUI("r-6", "2026-11-03", "14:00", "confirmada");
const CANCELADA_FUTURA = reservaDeUI("r-7", "2026-11-03", "17:00", "cancelada");
const CONFIRMADA_AJENA = reservaDeUI("r-9", "2026-11-03", "16:00", "confirmada", "u-2");

describe("obtenerProximaReserva", () => {
  it("devuelve la CONFIRMADA futura con menor inicio", () => {
    expect(obtenerProximaReserva([CONFIRMADA_18, CONFIRMADA_16], AHORA)?.id).toBe("r-3");
  });

  it("ignora pasadas, canceladas y devuelve null si no hay ninguna", () => {
    expect(
      obtenerProximaReserva([CONFIRMADA_AYER, CONFIRMADA_PASADA, CANCELADA_FUTURA], AHORA),
    ).toBeNull();
  });

  it("incluye la reserva que inicia exactamente ahora", () => {
    const ahoraExacto = reservaDeUI("r-8", "2026-11-03", "15:00", "confirmada");
    expect(obtenerProximaReserva([ahoraExacto], AHORA)?.id).toBe("r-8");
  });

  it("devuelve null con una lista vacia", () => {
    expect(obtenerProximaReserva([], AHORA)).toBeNull();
  });

  it("no filtra por usuario: la pantalla lo hace antes de llamarla", () => {
    // Home filtra por usuarioId antes; el adaptador devuelve la ajena igual.
    expect(obtenerProximaReserva([CONFIRMADA_AJENA], AHORA)?.id).toBe("r-9");
  });
});

describe("aMapaNombres", () => {
  it("mapea id de equipamiento a nombre", () => {
    const catalogo = [
      { id: "eq-1", nombre: "Raquetas" },
      { id: "eq-2", nombre: "Pelotas" },
    ] as EquipamientoApi[];

    expect(aMapaNombres(catalogo)).toEqual({
      "eq-1": "Raquetas",
      "eq-2": "Pelotas",
    });
  });
});

describe("textoItemsAlquiler", () => {
  it("forma 'N nombre plural' con nombres en minuscula", () => {
    const nombres = {
      "eq-2": "Raquetas de tenis",
      "eq-1": "Pelotas de tenis (tubo x3)",
    };

    expect(
      textoItemsAlquiler(
        [
          { equipamientoId: "eq-2", cantidad: 2 },
          { equipamientoId: "eq-1", cantidad: 3 },
        ],
        nombres,
      ),
    ).toBe("2 raquetas de tenis, 3 pelotas de tenis (tubo x3)");
  });

  it("usa 'Equipamiento' como respaldo cuando falta el nombre", () => {
    expect(
      textoItemsAlquiler(
        [{ equipamientoId: "eq-99", cantidad: 1 }],
        {},
      ),
    ).toBe("1 Equipamiento");
  });
});

describe("puedeCancelarReserva", () => {
  const CONFIRMADA_LUEGO = reservaDeUI("r-10", "2026-11-03", "17:00", "confirmada");

  it("es verdadera con 2 horas exactas de anticipacion", () => {
    const ahoraExacto = new Date(2026, 10, 3, 15, 0);
    expect(puedeCancelarReserva(CONFIRMADA_LUEGO, ahoraExacto)).toBe(true);
  });

  it("es falsa justo antes de las 2 horas", () => {
    const unMomentoDespues = new Date(2026, 10, 3, 15, 0, 1);
    expect(puedeCancelarReserva(CONFIRMADA_LUEGO, unMomentoDespues)).toBe(false);
  });

  it("es falsa para una reserva cancelada", () => {
    expect(
      puedeCancelarReserva(CANCELADA_FUTURA, new Date(2026, 10, 3, 10, 0)),
    ).toBe(false);
  });

  it("es falsa para una reserva ya iniciada", () => {
    expect(puedeCancelarReserva(CONFIRMADA_PASADA, AHORA)).toBe(false);
  });
});
