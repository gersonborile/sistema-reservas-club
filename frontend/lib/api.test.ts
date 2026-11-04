import { describe, expect, it, vi } from "vitest";

import {
  BASE_URL,
  cancelarReserva,
  crearAlquiler,
  crearReserva,
  obtenerEquipamiento,
  obtenerMisReservas,
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
