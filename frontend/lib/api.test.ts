import { describe, expect, it, vi } from "vitest";

import {
  ApiError,
  BASE_URL,
  anularPago,
  cancelarReserva,
  confirmarPago,
  crearAlquiler,
  crearCancha,
  crearEquipamiento,
  crearReserva,
  crearTurno,
  editarCancha,
  editarEquipamiento,
  editarTurno,
  eliminarTurno,
  obtenerEquipamiento,
  obtenerMisReservas,
  obtenerPago,
  registrarPago,
} from "@/lib/api";

type Respuesta = { status: number; cuerpo: unknown };

const OK = (cuerpo: unknown): Respuesta => ({ status: 200, cuerpo });

const RESERVA_API = {
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

function stubFetch(respuestas: Respuesta[]) {
  const pendientes = [...respuestas];
  const fetchMock = vi.fn(async () => {
    const { status, cuerpo } = pendientes.shift() ?? OK({});
    if (status === 204) {
      return new Response(null, { status });
    }
    return new Response(JSON.stringify(cuerpo), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function peticionDe(fetchMock: ReturnType<typeof stubFetch>, indice: number) {
  const [url, opciones] = fetchMock.mock.calls[indice] as unknown as [
    string,
    { method: string; body?: string },
  ];
  return { url, opciones };
}

const EQUIPAMIENTO_BASE = {
  disciplinaId: "d-1",
  disciplina: { id: "d-1", nombre: "tenis" },
  stockTotal: 10,
  stockDisponible: 10,
  precioUnitario: 500,
  activo: true,
  disponible: true,
};

const CANCHA_API = {
  id: "c-1",
  nombre: "Cancha 1",
  ubicacion: "Sector A",
  capacidad: 4,
  estado: "DISPONIBLE",
  disciplinas: [{ id: "d-1", nombre: "tenis" }],
};

function datosCancha(
  cambios: Partial<{
    nombre: string;
    ubicacion: string;
    capacidad: number;
    estado: "DISPONIBLE" | "OCUPADA" | "EN_MANTENIMIENTO";
    disciplinaIds: string[];
  }> = {},
) {
  return {
    nombre: "Cancha 1",
    ubicacion: "Sector A",
    capacidad: 4,
    estado: "DISPONIBLE" as const,
    disciplinaIds: ["d-1"],
    ...cambios,
  };
}

describe("crearCancha", () => {
  it("envia POST /canchas con los campos del backend y devuelve la cancha", async () => {
    const fetchMock = stubFetch([{ status: 201, cuerpo: CANCHA_API }]);

    const cancha = await crearCancha(datosCancha());

    expect(cancha.id).toBe("c-1");
    expect(cancha.estado).toBe("DISPONIBLE");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/canchas`);
    expect(opciones.method).toBe("POST");
    expect(opciones.body).toBe(
      JSON.stringify({
        nombre: "Cancha 1",
        ubicacion: "Sector A",
        capacidad: 4,
        estado: "DISPONIBLE",
        disciplinaIds: ["d-1"],
      }),
    );
  });

  it("expone los campos invalidos de un 400", async () => {
    stubFetch([
      {
        status: 400,
        cuerpo: {
          message: "La petición no es válida.",
          campos: [{ campo: "nombre", mensaje: "El nombre es obligatorio." }],
        },
      },
    ]);

    const error = await crearCancha(datosCancha({ nombre: "" })).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).campos).toEqual([
      { campo: "nombre", mensaje: "El nombre es obligatorio." },
    ]);
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      {
        status: 409,
        cuerpo: { message: "Ya existe una cancha con ese nombre." },
      },
    ]);

    await expect(crearCancha(datosCancha())).rejects.toThrow(
      "Ya existe una cancha con ese nombre.",
    );
  });
});

describe("editarCancha", () => {
  it("envia PUT /canchas/:id con los campos editados", async () => {
    const fetchMock = stubFetch([
      { status: 200, cuerpo: { ...CANCHA_API, nombre: "Cancha Central" } },
    ]);

    const cancha = await editarCancha("c-1", {
      nombre: "Cancha Central",
      disciplinaIds: ["d-1", "d-2"],
    });

    expect(cancha.nombre).toBe("Cancha Central");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/canchas/c-1`);
    expect(opciones.method).toBe("PUT");
    expect(opciones.body).toBe(
      JSON.stringify({
        nombre: "Cancha Central",
        disciplinaIds: ["d-1", "d-2"],
      }),
    );
  });
});

describe("crearEquipamiento", () => {
  it("envia POST /equipamiento con nombre, disciplina, stock y precio", async () => {
    const fetchMock = stubFetch([
      {
        status: 201,
        cuerpo: { id: "eq-1", nombre: "Paletas", ...EQUIPAMIENTO_BASE },
      },
    ]);

    const item = await crearEquipamiento({
      nombre: "Paletas",
      disciplinaId: "d-1",
      stockTotal: 12,
      precioUnitario: 1500.5,
    });

    expect(item.id).toBe("eq-1");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/equipamiento`);
    expect(opciones.method).toBe("POST");
    expect(opciones.body).toBe(
      JSON.stringify({
        nombre: "Paletas",
        disciplinaId: "d-1",
        stockTotal: 12,
        precioUnitario: 1500.5,
      }),
    );
  });

  it("expone los campos invalidos de un 400", async () => {
    stubFetch([
      {
        status: 400,
        cuerpo: {
          message: "La petición no es válida.",
          campos: [
            { campo: "precioUnitario", mensaje: "El precio unitario no puede ser negativo." },
          ],
        },
      },
    ]);

    const error = await crearEquipamiento({
      nombre: "Paletas",
      disciplinaId: "d-1",
      stockTotal: 12,
      precioUnitario: -1,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).campos).toEqual([
      {
        campo: "precioUnitario",
        mensaje: "El precio unitario no puede ser negativo.",
      },
    ]);
  });
});

describe("editarEquipamiento", () => {
  it("envia PUT /equipamiento/:id con el stock total", async () => {
    const fetchMock = stubFetch([
      {
        status: 200,
        cuerpo: { id: "eq-1", nombre: "Pelotas", ...EQUIPAMIENTO_BASE, stockTotal: 30 },
      },
    ]);

    const item = await editarEquipamiento("eq-1", { stockTotal: 30 });

    expect(item.stockTotal).toBe(30);
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/equipamiento/eq-1`);
    expect(opciones.method).toBe("PUT");
    expect(opciones.body).toBe(JSON.stringify({ stockTotal: 30 }));
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      {
        status: 409,
        cuerpo: {
          message: "El stock total no puede ser menor a la cantidad alquilada.",
        },
      },
    ]);

    await expect(editarEquipamiento("eq-1", { stockTotal: 1 })).rejects.toThrow(
      "El stock total no puede ser menor a la cantidad alquilada.",
    );
  });
});

describe("crearReserva", () => {
  it("envia POST /reservas con el turnoId y devuelve la reserva", async () => {
    const fetchMock = stubFetch([OK(RESERVA_API)]);

    const reserva = await crearReserva("t-1");

    expect(reserva.id).toBe("r-1");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/reservas`);
    expect(opciones.method).toBe("POST");
    expect(opciones.body).toBe(JSON.stringify({ turnoId: "t-1" }));
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      { status: 409, cuerpo: { message: "El turno ya tiene una reserva activa." } },
    ]);

    await expect(crearReserva("t-1")).rejects.toThrow(
      "El turno ya tiene una reserva activa.",
    );
  });
});

describe("obtenerMisReservas", () => {
  it("envia GET /reservas/mis y devuelve la lista", async () => {
    const fetchMock = stubFetch([OK([RESERVA_API])]);

    const reservas = await obtenerMisReservas();

    expect(reservas).toHaveLength(1);
    expect(reservas[0].id).toBe("r-1");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/reservas/mis`);
    expect(opciones.method).toBe("GET");
  });
});

describe("cancelarReserva", () => {
  it("envia PATCH /reservas/:id/cancelar", async () => {
    const fetchMock = stubFetch([OK(RESERVA_API)]);

    const reserva = await cancelarReserva("r-1");

    expect(reserva.id).toBe("r-1");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/reservas/r-1/cancelar`);
    expect(opciones.method).toBe("PATCH");
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      {
        status: 409,
        cuerpo: {
          message:
            "La reserva ya no puede cancelarse: el turno se inicia en menos de 2 horas.",
        },
      },
    ]);

    await expect(cancelarReserva("r-1")).rejects.toThrow(
      "La reserva ya no puede cancelarse: el turno se inicia en menos de 2 horas.",
    );
  });
});

describe("crearAlquiler", () => {
  it("envia POST /reservas/:id/alquiler con los items", async () => {
    const fetchMock = stubFetch([
      OK({ id: "alq-1", reservaId: "r-1", total: 1500, items: [] }),
    ]);

    const alquiler = await crearAlquiler("r-1", [
      { equipamientoId: "eq-1", cantidad: 2 },
    ]);

    expect(alquiler.id).toBe("alq-1");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/reservas/r-1/alquiler`);
    expect(opciones.method).toBe("POST");
    expect(opciones.body).toBe(
      JSON.stringify({ items: [{ equipamientoId: "eq-1", cantidad: 2 }] }),
    );
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      {
        status: 409,
        cuerpo: {
          message: "No hay stock disponible de uno de los equipamientos solicitados.",
        },
      },
    ]);

    await expect(
      crearAlquiler("r-1", [{ equipamientoId: "eq-1", cantidad: 99 }]),
    ).rejects.toThrow(
      "No hay stock disponible de uno de los equipamientos solicitados.",
    );
  });
});

describe("obtenerEquipamiento", () => {
  it("recorre las paginas con disciplinaId y disponible", async () => {
    const pagina1 = Array.from({ length: 50 }, (_, i) => ({
      id: `eq-p1-${i}`,
      nombre: `Item p1 ${i}`,
      ...EQUIPAMIENTO_BASE,
    }));
    const pagina2 = [
      { id: "eq-2", nombre: "Raquetas", ...EQUIPAMIENTO_BASE },
      { id: "eq-3", nombre: "Pelotas", ...EQUIPAMIENTO_BASE },
      { id: "eq-4", nombre: "Anteojos", ...EQUIPAMIENTO_BASE },
    ];
    const fetchMock = stubFetch([OK(pagina1), OK(pagina2)]);

    const items = await obtenerEquipamiento({ disciplinaId: "d-1", disponible: true });

    expect(items).toHaveLength(53);
    expect(fetchMock.mock.calls).toHaveLength(2);
    const { url } = peticionDe(fetchMock, 0);
    expect(url).toBe(
      `${BASE_URL}/equipamiento?disciplinaId=d-1&disponible=true&page=1&limit=50`,
    );
  });

  it("pide incluirInactivos sin disponible para el catalogo de nombres", async () => {
    const fetchMock = stubFetch([OK([EQUIPAMIENTO_BASE ? { id: "eq-5", nombre: "Pecheras", ...EQUIPAMIENTO_BASE, activo: false } : null])].filter(Boolean));

    await obtenerEquipamiento({ incluirInactivos: true });

    const { url } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/equipamiento?incluirInactivos=true&page=1&limit=50`);
  });
});

const TURNO_API = {
  id: "t-1",
  cancha_id: "c-1",
  disciplina_id: "d-1",
  fecha: "2026-11-05",
  hora_inicio: "18:00",
  hora_fin: "19:00",
  disponible: true,
};

const DATOS_TURNO = {
  cancha_id: "c-1",
  disciplina_id: "d-1",
  fecha: "2026-11-05",
  hora_inicio: "18:00",
  hora_fin: "19:00",
};

describe("crearTurno", () => {
  it("envia POST /turnos con el cuerpo snake_case y devuelve el turno", async () => {
    const fetchMock = stubFetch([{ status: 201, cuerpo: TURNO_API }]);

    const turno = await crearTurno(DATOS_TURNO);

    expect(turno.id).toBe("t-1");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/turnos`);
    expect(opciones.method).toBe("POST");
    expect(opciones.body).toBe(
      JSON.stringify({
        cancha_id: "c-1",
        disciplina_id: "d-1",
        fecha: "2026-11-05",
        hora_inicio: "18:00",
        hora_fin: "19:00",
      }),
    );
  });
});

describe("editarTurno", () => {
  it("envia PATCH /turnos/:id con los campos editados", async () => {
    const fetchMock = stubFetch([
      { status: 200, cuerpo: { ...TURNO_API, hora_inicio: "19:00", hora_fin: "20:00" } },
    ]);

    const turno = await editarTurno("t-1", {
      hora_inicio: "19:00",
      hora_fin: "20:00",
    });

    expect(turno.hora_inicio).toBe("19:00");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/turnos/t-1`);
    expect(opciones.method).toBe("PATCH");
    expect(opciones.body).toBe(
      JSON.stringify({ hora_inicio: "19:00", hora_fin: "20:00" }),
    );
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      {
        status: 409,
        cuerpo: {
          message: "Ya existe un turno superpuesto en esa cancha y fecha.",
        },
      },
    ]);

    await expect(
      editarTurno("t-1", { hora_inicio: "19:00", hora_fin: "20:00" }),
    ).rejects.toThrow("Ya existe un turno superpuesto en esa cancha y fecha.");
  });
});

describe("eliminarTurno", () => {
  it("envia DELETE /turnos/:id y resuelve sin cuerpo ante 204", async () => {
    const fetchMock = stubFetch([{ status: 204, cuerpo: null }]);

    await expect(eliminarTurno("t-1")).resolves.toBeUndefined();

    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/turnos/t-1`);
    expect(opciones.method).toBe("DELETE");
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      {
        status: 409,
        cuerpo: {
          message: "El turno tiene una reserva activa y no puede eliminarse.",
        },
      },
    ]);

    await expect(eliminarTurno("t-1")).rejects.toThrow(
      "El turno tiene una reserva activa y no puede eliminarse.",
    );
  });
});

const PAGO_API = {
  id: "p-1",
  reservaId: "r-1",
  monto: 3000,
  metodoPago: "EFECTIVO",
  estado: "PENDIENTE",
  fechaPago: null,
};

describe("registrarPago", () => {
  it("envia POST /reservas/:id/pagos con monto y metodoPago", async () => {
    const fetchMock = stubFetch([{ status: 201, cuerpo: PAGO_API }]);

    const pago = await registrarPago("r-1", {
      monto: 3000,
      metodoPago: "EFECTIVO",
    });

    expect(pago.id).toBe("p-1");
    expect(pago.estado).toBe("PENDIENTE");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/reservas/r-1/pagos`);
    expect(opciones.method).toBe("POST");
    expect(opciones.body).toBe(
      JSON.stringify({ monto: 3000, metodoPago: "EFECTIVO" }),
    );
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      {
        status: 409,
        cuerpo: { message: "La reserva ya tiene un pago registrado." },
      },
    ]);

    await expect(
      registrarPago("r-1", { monto: 3000, metodoPago: "EFECTIVO" }),
    ).rejects.toThrow("La reserva ya tiene un pago registrado.");
  });
});

describe("confirmarPago", () => {
  it("envia PATCH /pagos/:id/pagar y devuelve el pago PAGADO", async () => {
    const fetchMock = stubFetch([
      {
        status: 200,
        cuerpo: {
          ...PAGO_API,
          estado: "PAGADO",
          fechaPago: "2026-11-03T10:00:00.000Z",
        },
      },
    ]);

    const pago = await confirmarPago("p-1");

    expect(pago.estado).toBe("PAGADO");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/pagos/p-1/pagar`);
    expect(opciones.method).toBe("PATCH");
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      {
        status: 409,
        cuerpo: {
          message: "Solo se puede confirmar el cobro de un pago pendiente.",
        },
      },
    ]);

    await expect(confirmarPago("p-1")).rejects.toThrow(
      "Solo se puede confirmar el cobro de un pago pendiente.",
    );
  });
});

describe("anularPago", () => {
  it("envia PATCH /pagos/:id/anular y devuelve el pago ANULADO", async () => {
    const fetchMock = stubFetch([
      { status: 200, cuerpo: { ...PAGO_API, estado: "ANULADO" } },
    ]);

    const pago = await anularPago("p-1");

    expect(pago.estado).toBe("ANULADO");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/pagos/p-1/anular`);
    expect(opciones.method).toBe("PATCH");
  });

  it("propaga el mensaje del backend ante 409", async () => {
    stubFetch([
      { status: 409, cuerpo: { message: "El pago ya está anulado." } },
    ]);

    await expect(anularPago("p-1")).rejects.toThrow(
      "El pago ya está anulado.",
    );
  });
});

describe("obtenerPago", () => {
  it("envia GET /reservas/:id/pagos y devuelve el pago", async () => {
    const fetchMock = stubFetch([OK(PAGO_API)]);

    const pago = await obtenerPago("r-1");

    expect(pago?.id).toBe("p-1");
    const { url, opciones } = peticionDe(fetchMock, 0);
    expect(url).toBe(`${BASE_URL}/reservas/r-1/pagos`);
    expect(opciones.method).toBe("GET");
  });

  it("devuelve null cuando el backend responde 404 por falta de pago", async () => {
    stubFetch([
      { status: 404, cuerpo: { message: "El pago indicado no existe." } },
    ]);

    await expect(obtenerPago("r-1")).resolves.toBeNull();
  });

  it("propaga los errores que no son 404", async () => {
    stubFetch([
      { status: 500, cuerpo: { message: "Error interno del servidor." } },
    ]);

    await expect(obtenerPago("r-1")).rejects.toThrow(
      "Error interno del servidor.",
    );
  });
});
