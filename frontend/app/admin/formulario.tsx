import { ApiError } from "@/lib/api";
import type { CampoInvalido } from "@/lib/tipos";

export const ESTILOS_BOTON_SECUNDARIO =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";

export const ESTILOS_BOTON_SECUNDARIO_DESHABILITADO =
  "cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-slate-400";

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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <p className="text-sm text-red-600">{mensaje}</p>
      <button
        type="button"
        onClick={onReintentar}
        disabled={reintentando}
        className={`mt-4 ${estilosBotonPrincipal(reintentando)}`}
      >
        {reintentando ? "Reintentando..." : "Reintentar"}
      </button>
    </div>
  );
}

export function estilosBotonPrincipal(deshabilitado: boolean): string {
  return `rounded-xl px-4 py-2 text-sm font-medium transition ${
    deshabilitado
      ? "cursor-not-allowed bg-slate-300 text-white"
      : "bg-slate-900 text-white hover:bg-slate-800"
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
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:text-slate-500";

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
    <div className="flex flex-1 flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wide text-slate-500"
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
        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
      />
    </Campo>
  );
}
