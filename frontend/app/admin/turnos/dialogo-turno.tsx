"use client";

import type { CanchaUI } from "@/lib/adaptadores";
import { aEtiquetaDisciplina } from "@/lib/adaptadores";

import { estilosBotonPrincipal, estilosBotonSecundario } from "../formulario";

export type FormularioTurno = {
  id: string | null;
  disciplinaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  error: string | null;
};

export type CambiosFormularioTurno = Partial<
  Pick<FormularioTurno, "disciplinaId" | "fecha" | "horaInicio" | "horaFin">
>;

const CLASES_CONTROL =
  "h-9 rounded border border-neutral-300 bg-white px-2 text-sm text-neutral-900 disabled:bg-neutral-100";

function Campo({
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

/** Formulario modal para crear o editar un turno de la cancha elegida. */
export default function DialogoTurno({
  formulario,
  canchaEtiqueta,
  disciplinas,
  enviando,
  onCambiar,
  onCancelar,
  onGuardar,
}: {
  formulario: FormularioTurno;
  canchaEtiqueta: string;
  disciplinas: CanchaUI["disciplinas"];
  enviando: boolean;
  onCambiar: (cambios: CambiosFormularioTurno) => void;
  onCancelar: () => void;
  onGuardar: () => void;
}) {
  const titulo = formulario.id ? "Editar turno" : "Nuevo turno";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-label={titulo}
        className="w-full max-w-lg rounded-lg border border-neutral-800 bg-white p-6"
      >
        <h2 className="mb-4 text-base font-bold text-neutral-900">{titulo}</h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-neutral-500">
              Cancha
            </span>
            <input
              type="text"
              value={canchaEtiqueta}
              readOnly
              className="h-9 rounded border border-neutral-300 bg-neutral-100 px-2 text-sm text-neutral-600"
            />
          </div>
          <Campo id="disciplina" etiqueta="Disciplina">
            <select
              id="disciplina"
              value={formulario.disciplinaId}
              onChange={(e) => onCambiar({ disciplinaId: e.target.value })}
              disabled={enviando}
              className={CLASES_CONTROL}
            >
              {disciplinas.length ? null : <option value="">Sin disciplinas</option>}
              {disciplinas.map((disciplina) => (
                <option key={disciplina.id} value={disciplina.id}>
                  {aEtiquetaDisciplina(disciplina.nombre)}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">
              Solo las disciplinas de esta cancha.
            </p>
          </Campo>
          <Campo id="fecha-turno" etiqueta="Fecha">
            <input
              id="fecha-turno"
              type="date"
              value={formulario.fecha}
              onChange={(e) => onCambiar({ fecha: e.target.value })}
              disabled={enviando}
              className={CLASES_CONTROL}
            />
          </Campo>
          <div className="flex gap-3">
            <Campo id="hora-inicio" etiqueta="Hora de inicio">
              <input
                id="hora-inicio"
                type="time"
                value={formulario.horaInicio}
                onChange={(e) => onCambiar({ horaInicio: e.target.value })}
                disabled={enviando}
                className={CLASES_CONTROL}
              />
            </Campo>
            <Campo id="hora-fin" etiqueta="Hora de fin">
              <input
                id="hora-fin"
                type="time"
                value={formulario.horaFin}
                onChange={(e) => onCambiar({ horaFin: e.target.value })}
                disabled={enviando}
                className={CLASES_CONTROL}
              />
            </Campo>
          </div>
          {formulario.error ? (
            <div
              role="alert"
              className="rounded border border-neutral-800 bg-neutral-100 p-3 text-sm text-red-600"
            >
              {formulario.error}
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            className={estilosBotonSecundario(enviando)}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onGuardar}
            disabled={enviando}
            className={estilosBotonPrincipal(enviando)}
          >
            {enviando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
