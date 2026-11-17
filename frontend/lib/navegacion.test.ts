import { describe, expect, it } from "vitest";

import {
  rutaLoginConRetorno,
  rutaRetornoSegura,
} from "@/lib/navegacion";

describe("rutaRetornoSegura", () => {
  it("acepta una ruta interna con query", () => {
    expect(
      rutaRetornoSegura("/canchas/1/reservar?fecha=2026-11-17"),
    ).toBe("/canchas/1/reservar?fecha=2026-11-17");
  });

  it("rechaza valores vacíos", () => {
    expect(rutaRetornoSegura(null)).toBeNull();
    expect(rutaRetornoSegura("")).toBeNull();
  });

  it("rechaza URLs absolutas y de otro origen", () => {
    expect(rutaRetornoSegura("https://evil.test")).toBeNull();
    expect(rutaRetornoSegura("//evil.test")).toBeNull();
  });

  it("rechaza barras invertidas", () => {
    expect(rutaRetornoSegura("/\\evil.test")).toBeNull();
  });
});

describe("rutaLoginConRetorno", () => {
  it("codifica la ruta actual como parámetro", () => {
    expect(rutaLoginConRetorno("/canchas/1/reservar?fecha=2026-11-17")).toBe(
      "/login?redirigir=%2Fcanchas%2F1%2Freservar%3Ffecha%3D2026-11-17",
    );
  });
});
