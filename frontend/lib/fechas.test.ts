import { describe, expect, it } from "vitest";

import {
  etiquetaFechaRelativa,
  generarDiasCalendario,
  sumarDias,
} from "@/lib/fechas";

describe("sumarDias", () => {
  it("suma un día respetando el cambio de mes", () => {
    expect(sumarDias("2026-11-30", 1)).toBe("2026-12-01");
  });

  it("suma varios días y cruza el año", () => {
    expect(sumarDias("2026-12-31", 2)).toBe("2027-01-02");
  });

  it("devuelve la fecha original si es inválida", () => {
    expect(sumarDias("no-es-fecha", 1)).toBe("no-es-fecha");
  });
});

describe("etiquetaFechaRelativa", () => {
  it("reconoce hoy", () => {
    expect(etiquetaFechaRelativa("2026-11-17", "2026-11-17")).toBe("hoy");
  });

  it("reconoce mañana", () => {
    expect(etiquetaFechaRelativa("2026-11-18", "2026-11-17")).toBe("mañana");
  });

  it("usa la fecha corta para el resto", () => {
    expect(etiquetaFechaRelativa("2026-11-20", "2026-11-17")).toBe("el 20/11");
  });
});

describe("generarDiasCalendario", () => {
  it("genera siete días consecutivos con día abreviado y número", () => {
    const dias = generarDiasCalendario("2026-11-17", 7);
    expect(dias).toHaveLength(7);
    expect(dias[0]).toMatchObject({
      fecha: "2026-11-17",
      dia: "Mar",
      numero: "17",
    });
    expect(dias[6].fecha).toBe("2026-11-23");
  });

  it("devuelve una lista vacía para una fecha inválida o cantidad no positiva", () => {
    expect(generarDiasCalendario("no-es-fecha", 7)).toEqual([]);
    expect(generarDiasCalendario("2026-11-17", 0)).toEqual([]);
  });
});
