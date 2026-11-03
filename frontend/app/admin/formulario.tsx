import { ApiError } from "@/lib/api";
import type { CampoInvalido } from "@/lib/tipos";

export const ESTILOS_BOTON_SECUNDARIO =
  "rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50";

export const ESTILOS_BOTON_SECUNDARIO_DESHABILITADO =
  "cursor-not-allowed rounded border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-400";

export function estilosBotonPrincipal(deshabilitado: boolean): string {
  return `rounded px-4 py-2 text-sm font-medium ${
    deshabilitado
      ? "cursor-not-allowed bg-neutral-400 text-white"
      : "bg-neutral-900 text-white hover:bg-neutral-800"
  }`;
}

/** Campos inválidos que devolvió el backend; vacío si el error no los trae. */
export function camposDeError(error: unknown): CampoInvalido[] {
  return error instanceof ApiError ? error.campos : [];
}

export function mensajeDeCampo(
  campos: CampoInvalido[],
  campo: string,
): string | null {
  return campos.find((item) => item.campo === campo)?.mensaje ?? null;
}

export function ErrorDeCampo({
  campos,
  campo,
}: {
  campos: CampoInvalido[];
  campo: string;
}) {
  const mensaje = mensajeDeCampo(campos, campo);
  return mensaje ? <p className="mt-1 text-xs text-red-600">{mensaje}</p> : null;
}
