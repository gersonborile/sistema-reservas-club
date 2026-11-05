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
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="¿Eliminar este turno?"
        className="w-full max-w-md rounded-lg border border-neutral-800 bg-white p-6"
      >
        <h2 className="mb-2 text-base font-bold text-neutral-900">
          ¿Eliminar este turno?
        </h2>
        <p className="text-sm text-neutral-900">{detalle}</p>
        <p className="mt-1 text-xs text-neutral-500">
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
