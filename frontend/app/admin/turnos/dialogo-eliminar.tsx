"use client";

import { estilosBotonPrincipal, estilosBotonSecundario } from "../formulario";

/** Confirmación para eliminar un turno; `detalle` describe qué se elimina. */
export default function DialogoEliminar({
  detalle,
  eliminando,
  onCancelar,
  onConfirmar,
}: {
  detalle: string;
  eliminando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="¿Eliminar este turno?"
        className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl"
      >
        <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
          ¿Eliminar este turno?
        </h2>
        <p className="text-sm text-slate-900">{detalle}</p>
        <p className="mt-1 text-xs text-slate-500">
          Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={eliminando}
            className={estilosBotonSecundario(eliminando)}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={eliminando}
            className={estilosBotonPrincipal(eliminando)}
          >
            {eliminando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}


