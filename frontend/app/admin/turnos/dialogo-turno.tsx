"use client";

import type { CanchaUI } from "@/lib/adaptadores";
import { aEtiquetaDisciplina } from "@/lib/adaptadores";
import { franjasDelClub } from "@/lib/franjas";

import {
  Campo,
  CampoSoloLectura,
  CLASES_CONTROL,
  estilosBotonPrincipal,
  estilosBotonSecundario,
} from "../formulario";

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
  const franjas = franjasDelClub();

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
          <CampoSoloLectura
            id="cancha-turno"
            etiqueta="Cancha"
            valor={canchaEtiqueta}
          />
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
              <select
                id="hora-inicio"
                value={formulario.horaInicio}
                onChange={(e) => {
                  const inicio = e.target.value;
                  const fin =
                    franjas.find((franja) => franja.inicio === inicio)?.fin ??
                    "";
                  onCambiar({ horaInicio: inicio, horaFin: fin });
                }}
                disabled={enviando}
                className={CLASES_CONTROL}
              >
                <option value="">Elegí una hora</option>
                {franjas.map((franja) => (
                  <option key={franja.inicio} value={franja.inicio}>
                    {franja.inicio}
                  </option>
                ))}
              </select>
            </Campo>
            <CampoSoloLectura
              id="hora-fin"
              etiqueta="Hora de fin"
              valor={formulario.horaFin}
            />
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
