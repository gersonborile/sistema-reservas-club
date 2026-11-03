import { describe, expect, it } from "vitest";

import type {
  CanchaApi,
  EquipamientoApi,
  PagoApi,
  ReservaApi,
  TurnoApi,
} from "@/lib/api";
import {
  accionesDePago,
  aEquipamientoUI,
  aReservaUI,
  aTurnoUI,
  aMapaNombres,
  montoSugerido,
  contarCanchasActivas,
  contarPocoStock,
  contarReservasDeHoy,
  disciplinaIdsParaEditar,
  filtrarReservasPorEstado,
  ordenarReservas,
  obtenerProximaReserva,
  puedeCancelarReserva,
  textoItemsAlquiler,
  validarDatosTurno,
  validarHorario,
  validarStock,
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

function reservaApiDe(
  id: string,
  fecha: string,
  estado: ReservaApi["estado"],
  usuarioId = "u-1",
): ReservaApi {
  return {
    id,
    usuarioId,
    turnoId: `t-${id}`,
    estado,
    createdAt: "2026-11-01T10:00:00.000Z",
    alquiler: null,
    turno: {
      fecha,
      horaInicio: "18:00",
      horaFin: "19:00",
      cancha: { id: "c-1", nombre: "Cancha 1" },
    },
  };
}

const TURNO_BACKEND: TurnoApi = {
  id: "t-1",
  cancha_id: "c-1",
  disciplina_id: "d-1",
  fecha: "2026-11-05",
  hora_inicio: "18:00",
  hora_fin: "19:00",
  disponible: true,
};

describe("aTurnoUI", () => {
  it("mapea hora de inicio, hora de fin y disciplina", () => {
    expect(aTurnoUI(TURNO_BACKEND)).toEqual({
      id: "t-1",
      horaInicio: "18:00",
      horaFin: "19:00",
      disciplinaId: "d-1",
      estado: "libre",
    });
  });

  it("marca ocupado cuando el turno no esta disponible", () => {
    expect(aTurnoUI({ ...TURNO_BACKEND, disponible: false }).estado).toBe(
      "ocupado",
    );
  });
});

function pagoDe(estado: PagoApi["estado"]): PagoApi {
  return {
    id: "p-1",
    reservaId: "r-1",
    monto: 3000,
    metodoPago: "EFECTIVO",
    estado,
    fechaPago: null,
  };
}

describe("accionesDePago", () => {
  it("ofrece registrar cuando la reserva confirmada no tiene pago", () => {
    expect(accionesDePago("confirmada", null)).toEqual(["registrar"]);
  });

  it("no ofrece acciones cuando la reserva cancelada no tiene pago", () => {
    expect(accionesDePago("cancelada", null)).toEqual([]);
  });

  it("ofrece confirmar y anular con un pago pendiente", () => {
    expect(accionesDePago("confirmada", pagoDe("PENDIENTE"))).toEqual([
      "confirmar",
      "anular",
    ]);
  });

  it("ofrece solo anular con un pago pagado", () => {
    expect(accionesDePago("confirmada", pagoDe("PAGADO"))).toEqual(["anular"]);
  });

  it("deja el pago anulado en solo lectura", () => {
    expect(accionesDePago("confirmada", pagoDe("ANULADO"))).toEqual([]);
  });

  it("ofrece solo anular un pago pendiente de una reserva cancelada", () => {
    expect(accionesDePago("cancelada", pagoDe("PENDIENTE"))).toEqual(["anular"]);
  });

  it("ofrece solo anular un pago pagado de una reserva cancelada", () => {
    expect(accionesDePago("cancelada", pagoDe("PAGADO"))).toEqual(["anular"]);
  });

  it("deja en solo lectura el pago anulado de una reserva cancelada", () => {
    expect(accionesDePago("cancelada", pagoDe("ANULADO"))).toEqual([]);
  });
});

describe("montoSugerido", () => {
  it("devuelve el total del alquiler cuando la reserva tiene uno", () => {
    const reserva = aReservaUI({
      ...CON_TURNO_Y_SIN_ALQUILER,
      alquiler: { id: "alq-1", total: 3100, items: [] },
    });

    expect(montoSugerido(reserva)).toBe(3100);
  });

  it("devuelve vacio cuando la reserva no tiene alquiler", () => {
    expect(montoSugerido(aReservaUI(CON_TURNO_Y_SIN_ALQUILER))).toBeNull();
  });
});

describe("aEquipamientoUI", () => {
  it("normaliza el precio y el stock a numeros", () => {
    const api = {
      id: "eq-1",
      nombre: "Paletas",
      disciplinaId: "d-2",
      disciplina: { id: "d-2", nombre: "padel" },
      stockTotal: "12" as unknown as number,
      stockDisponible: "7" as unknown as number,
      precioUnitario: "1500.50" as unknown as number,
      activo: true,
      disponible: true,
    };

    expect(aEquipamientoUI(api)).toEqual({
      id: "eq-1",
      nombre: "Paletas",
      disciplinaId: "d-2",
      disciplinaNombre: "padel",
      stockTotal: 12,
      stockDisponible: 7,
      precioUnitario: 1500.5,
      activo: true,
    });
  });
});

describe("contarCanchasActivas", () => {
  it("cuenta las que no estan en mantenimiento", () => {
    const canchas = [
      { estado: "DISPONIBLE" },
      { estado: "EN_MANTENIMIENTO" },
      { estado: "OCUPADA" },
    ] as CanchaApi[];

    expect(contarCanchasActivas(canchas)).toBe(2);
  });
});

describe("contarPocoStock", () => {
  it("cuenta las de stock total menor o igual al umbral", () => {
    const items = [
      { stockTotal: 0 },
      { stockTotal: 5 },
      { stockTotal: 6 },
      { stockTotal: 20 },
    ] as EquipamientoApi[];

    expect(contarPocoStock(items)).toBe(2);
  });
});

describe("contarReservasDeHoy", () => {
  it("cuenta las CONFIRMADA de hoy de todos los usuarios", () => {
    const reservas = [
      reservaApiDe("r-1", "2026-11-03", "CONFIRMADA", "u-1"),
      reservaApiDe("r-2", "2026-11-03", "CONFIRMADA", "u-2"),
      reservaApiDe("r-3", "2026-11-03", "CANCELADA", "u-3"),
      reservaApiDe("r-4", "2026-11-04", "CONFIRMADA", "u-4"),
    ];

    expect(contarReservasDeHoy(reservas, "2026-11-03")).toBe(2);
  });
});

const ERROR_STOCK = "El stock debe ser un entero mayor o igual a 0.";

describe("validarStock", () => {
  it("rechaza un valor vacio", () => {
    expect(validarStock("")).toBe(ERROR_STOCK);
  });

  it("rechaza un decimal", () => {
    expect(validarStock("1.5")).toBe(ERROR_STOCK);
  });

  it("rechaza un negativo", () => {
    expect(validarStock("-1")).toBe(ERROR_STOCK);
  });

  it("acepta cero", () => {
    expect(validarStock("0")).toBeNull();
  });

  it("acepta un entero positivo", () => {
    expect(validarStock("30")).toBeNull();
  });
});

const ERROR_HORA_OBLIGATORIA = "La hora es obligatoria.";
const ERROR_HORA_FORMATO = "Usá el formato HH:mm.";

describe("validarHorario", () => {
  it("rechaza un texto vacio como obligatorio", () => {
    expect(validarHorario("")).toBe(ERROR_HORA_OBLIGATORIA);
  });

  it("rechaza un texto que no tiene formato HH:mm", () => {
    expect(validarHorario("9:00")).toBe(ERROR_HORA_FORMATO);
  });

  it("acepta una hora valida en formato HH:mm", () => {
    expect(validarHorario("18:30")).toBeNull();
  });
});

describe("validarDatosTurno", () => {
  const VALIDO = {
    disciplinaId: "d-1",
    fecha: "2026-11-04",
    horaInicio: "10:00",
    horaFin: "11:00",
  };

  it("acepta un turno con todos los campos validos", () => {
    expect(validarDatosTurno(VALIDO)).toBeNull();
  });

  it("pide elegir una disciplina", () => {
    expect(validarDatosTurno({ ...VALIDO, disciplinaId: "" })).toBe(
      "Elegí una disciplina.",
    );
  });

  it("pide la fecha", () => {
    expect(validarDatosTurno({ ...VALIDO, fecha: "" })).toBe(
      "La fecha es obligatoria.",
    );
  });

  it("pide la hora de inicio", () => {
    expect(validarDatosTurno({ ...VALIDO, horaInicio: "" })).toBe(
      "La hora es obligatoria.",
    );
  });

  it("rechaza una hora de fin sin formato HH:mm", () => {
    expect(validarDatosTurno({ ...VALIDO, horaFin: "9:00" })).toBe(
      "Usá el formato HH:mm.",
    );
  });

  it("informa primero la disciplina cuando faltan varios campos", () => {
    expect(
      validarDatosTurno({ disciplinaId: "", fecha: "", horaInicio: "", horaFin: "" }),
    ).toBe("Elegí una disciplina.");
  });
});

describe("disciplinaIdsParaEditar", () => {
  it("conserva todas las disciplinas existentes al editar", () => {
    expect(disciplinaIdsParaEditar(["d-1", "d-2"], "d-1")).toEqual([
      "d-1",
      "d-2",
    ]);
  });

  it("agrega la disciplina elegida sin duplicar las existentes", () => {
    expect(disciplinaIdsParaEditar(["d-1", "d-2"], "d-3")).toEqual([
      "d-1",
      "d-2",
      "d-3",
    ]);
  });

  it("usa la elegida cuando la cancha no tiene disciplinas", () => {
    expect(disciplinaIdsParaEditar([], "d-1")).toEqual(["d-1"]);
  });

  it("con una disciplina vacia conserva solo las existentes", () => {
    expect(disciplinaIdsParaEditar(["d-1", "d-2"], "")).toEqual([
      "d-1",
      "d-2",
    ]);
  });
});

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

describe("ordenarReservas", () => {
  it("ordena por fecha y hora ascendentes, con las mas proximas primero", () => {
    const desordenadas = [
      reservaDeUI("r-b", "2026-11-06", "09:00", "confirmada"),
      reservaDeUI("r-a", "2026-11-05", "18:00", "confirmada"),
      reservaDeUI("r-c", "2026-11-05", "09:00", "confirmada"),
    ];

    expect(ordenarReservas(desordenadas).map((reserva) => reserva.id)).toEqual([
      "r-c",
      "r-a",
      "r-b",
    ]);
  });
});

describe("filtrarReservasPorEstado", () => {
  const lista = [
    reservaDeUI("r-1", "2026-11-05", "09:00", "confirmada"),
    reservaDeUI("r-2", "2026-11-05", "10:00", "cancelada"),
    reservaDeUI("r-3", "2026-11-06", "11:00", "confirmada"),
  ];

  it("con Todas devuelve la lista completa", () => {
    expect(
      filtrarReservasPorEstado(lista, "Todas").map((reserva) => reserva.id),
    ).toEqual(["r-1", "r-2", "r-3"]);
  });

  it("con Confirmadas deja solo las confirmadas", () => {
    expect(
      filtrarReservasPorEstado(lista, "Confirmadas").map(
        (reserva) => reserva.id,
      ),
    ).toEqual(["r-1", "r-3"]);
  });

  it("con Canceladas deja solo las canceladas", () => {
    expect(
      filtrarReservasPorEstado(lista, "Canceladas").map(
        (reserva) => reserva.id,
      ),
    ).toEqual(["r-2"]);
  });
});

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
