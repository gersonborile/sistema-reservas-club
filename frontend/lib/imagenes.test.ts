import { describe, expect, it } from "vitest";

import {
  IMAGEN_POR_DEFECTO,
  imagenDisciplina,
  normalizarDisciplina,
} from "@/lib/imagenes";

describe("normalizarDisciplina", () => {
  it("pasa a minúsculas, quita tildes y colapsa espacios", () => {
    expect(normalizarDisciplina("  FÚTBOL   Femenino ")).toBe(
      "futbol femenino",
    );
  });

  it("mantiene los nombres sin cambios cuando ya están normalizados", () => {
    expect(normalizarDisciplina("padel")).toBe("padel");
  });
});

describe("imagenDisciplina", () => {
  it("resuelve tenis, fútbol y pádel sin importar mayúsculas o tildes", () => {
    expect(imagenDisciplina("Tenis")).toContain("tenis.webp");
    expect(imagenDisciplina("Fútbol")).toContain("futbol.webp");
    expect(imagenDisciplina("PÁDEL")).toContain("padel.webp");
  });

  it("usa la imagen por defecto para una disciplina desconocida", () => {
    expect(imagenDisciplina("Básquet")).toBe(IMAGEN_POR_DEFECTO);
  });
});
