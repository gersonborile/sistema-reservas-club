import { afterEach, describe, expect, it, vi } from "vitest";

import { limpiarDatosHeredados } from "@/lib/almacen-sesion";

const CLAVES_DEL_MOCK = [
  "clubDeportivo.reservas",
  "clubDeportivo.canchas",
  "clubDeportivo.equipamiento",
  "clubDeportivo.usuariosMock",
];

/** localStorage en memoria, con las operaciones que usa el código. */
function almacenEnMemoria(inicial: Record<string, string>) {
  const datos = new Map(Object.entries(inicial));
  return {
    datos,
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => void datos.set(clave, valor),
    removeItem: (clave: string) => void datos.delete(clave),
  };
}

function conAlmacen(almacen: unknown) {
  vi.stubGlobal("window", { localStorage: almacen });
}

describe("limpiarDatosHeredados", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("borra las cuatro claves del mock", () => {
    const almacen = almacenEnMemoria({
      "clubDeportivo.reservas": "[]",
      "clubDeportivo.canchas": "[]",
      "clubDeportivo.equipamiento": "[]",
      "clubDeportivo.usuariosMock": "[]",
    });
    conAlmacen(almacen);

    limpiarDatosHeredados();

    for (const clave of CLAVES_DEL_MOCK) {
      expect(almacen.datos.has(clave)).toBe(false);
    }
  });

  it("no toca el token, el usuario ni el tema", () => {
    const almacen = almacenEnMemoria({
      "clubDeportivo.reservas": "[]",
      "clubDeportivo.token": "token-de-sesion",
      "clubDeportivo.usuario": '{"id":"u-1"}',
      theme: "dark",
    });
    conAlmacen(almacen);

    limpiarDatosHeredados();

    expect(almacen.datos.get("clubDeportivo.token")).toBe("token-de-sesion");
    expect(almacen.datos.get("clubDeportivo.usuario")).toBe('{"id":"u-1"}');
    expect(almacen.datos.get("theme")).toBe("dark");
  });

  it("no cambia nada ni falla cuando no hay datos heredados", () => {
    const almacen = almacenEnMemoria({ theme: "light" });
    conAlmacen(almacen);

    expect(() => limpiarDatosHeredados()).not.toThrow();

    expect([...almacen.datos.entries()]).toEqual([["theme", "light"]]);
  });

  it("no propaga el error si el almacenamiento lanza una excepción", () => {
    conAlmacen({
      removeItem: () => {
        throw new Error("Almacenamiento no disponible");
      },
    });

    expect(() => limpiarDatosHeredados()).not.toThrow();
  });

  it("no falla cuando no hay navegador", () => {
    expect(() => limpiarDatosHeredados()).not.toThrow();
  });
});
