import { describe, expect, it } from "vitest";

import { formatearDuracion, formatearMoneda } from "@/lib/formato";

describe("formatearMoneda", () => {
  it("formatea un precio entero en pesos", () => {
    expect(formatearMoneda(1500)).toContain("1.500");
  });

  it("usa cero para valores inválidos", () => {
    expect(formatearMoneda(Number.NaN)).toContain("0");
  });
});

describe("formatearDuracion", () => {
  it("muestra minutos para duraciones positivas", () => {
    expect(formatearDuracion(60)).toBe("60 min");
  });

  it("devuelve null para duraciones inválidas", () => {
    expect(formatearDuracion(null)).toBeNull();
    expect(formatearDuracion(0)).toBeNull();
  });
});
