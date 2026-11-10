import { ApiError } from "@/lib/api";
import type { CampoInvalido } from "@/lib/tipos";

export const ESTILOS_BOTON_SECUNDARIO =
  "rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50";

export const ESTILOS_BOTON_SECUNDARIO_DESHABILITADO =
  "cursor-not-allowed rounded border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-400";

export function estilosBotonSecundario(deshabilitado: boolean): string {
  return deshabilitado
    ? ESTILOS_BOTON_SECUNDARIO_DESHABILITADO
    : ESTILOS_BOTON_SECUNDARIO;
}

/** Error de carga con un botón para reintentar, que informa mientras espera. */
export function ErrorConReintento({
  mensaje,
  reintentando,
  onReintentar,
}: {
  mensaje: string;
  reintentando: boolean;
  onReintentar: () => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <p className="text-sm text-red-600">{mensaje}</p>
      <button
        type="button"
        onClick={onReintentar}
        disabled={reintentando}
        className={`mt-3 ${estilosBotonPrincipal(reintentando)}`}
      >
        {reintentando ? "Reintentando..." : "Reintentar"}
      </button>
    </div>
  );
}

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

export const CLASES_CONTROL =
  "h-9 rounded border border-neutral-300 bg-white px-2 text-sm text-neutral-900 disabled:bg-neutral-100";

/** Campo de formulario con su etiqueta asociada al control por `id`. */
export function Campo({
  id,
  etiqueta,
  children,
}: {
  id: string;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[10px] uppercase tracking-wide text-neutral-500"
      >
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

/** Campo de texto que solo muestra un valor, sin poder editarlo. */
export function CampoSoloLectura({
  id,
  etiqueta,
  valor,
}: {
  id: string;
  etiqueta: string;
  valor: string;
}) {
  return (
    <Campo id={id} etiqueta={etiqueta}>
      <input
        id={id}
        type="text"
        value={valor}
        readOnly
        className="h-9 rounded border border-neutral-300 bg-neutral-100 px-2 text-sm text-neutral-600"
      />
    </Campo>
  );
}
