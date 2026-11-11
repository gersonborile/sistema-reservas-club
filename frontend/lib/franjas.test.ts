import { describe, expect, it } from "vitest";

import {
  APERTURA,
  CIERRE,
  DURACION_MINUTOS,
  franjasDelClub,
  horarioParaEditar,
} from "@/lib/franjas";

describe("horarioParaEditar", () => {
  it("mantiene un turno que ya es una franja del club", () => {
    expect(horarioParaEditar("14:00")).toEqual({
      horaInicio: "14:00",
      horaFin: "15:00",
    });
  });

  it("recalcula el fin de un turno viejo que empieza en una franja", () => {
    expect(horarioParaEditar("09:00")).toEqual({
      horaInicio: "09:00",
      horaFin: "10:00",
    });
  });

  it("deja el horario vacío si el inicio no es una franja", () => {
    expect(horarioParaEditar("08:30")).toEqual({
      horaInicio: "",
      horaFin: "",
    });
  });
});

describe("franjasDelClub", () => {
  it("devuelve las 14 franjas de 08:00 a 22:00", () => {
    const franjas = franjasDelClub();

    expect(franjas).toHaveLength(14);
    expect(franjas[0]).toEqual({ inicio: "08:00", fin: "09:00" });
    expect(franjas[13]).toEqual({ inicio: "21:00", fin: "22:00" });
  });

  it("las franjas son consecutivas y sin margen", () => {
    const franjas = franjasDelClub();

    for (let i = 1; i < franjas.length; i += 1) {
      expect(franjas[i].inicio).toBe(franjas[i - 1].fin);
    }
  });

  it("expone las constantes del horario del club", () => {
    expect(APERTURA).toBe("08:00");
    expect(CIERRE).toBe("22:00");
    expect(DURACION_MINUTOS).toBe(60);
  });
});
