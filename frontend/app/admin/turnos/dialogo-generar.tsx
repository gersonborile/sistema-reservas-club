"use client";

import { useState } from "react";

import type { CanchaUI } from "@/lib/adaptadores";
import { aEtiquetaDisciplina, validarGeneracion } from "@/lib/adaptadores";
import { generarTurnos, mensajeDeErrorAdmin } from "@/lib/api";
import type { ResultadoGeneracion } from "@/lib/api";
import { obtenerFechaLocalHoy } from "@/lib/fechas";

import {
  Campo,
  CampoSoloLectura,
  CLASES_CONTROL,
  estilosBotonPrincipal,
  estilosBotonSecundario,
} from "../formulario";

/** Genera en bloque las franjas de una cancha y disciplina para un rango. */
export default function DialogoGenerar({
  cancha,
  onCancelar,
  onGenerado,
}: {
  cancha: CanchaUI;
  onCancelar: () => void;
  onGenerado: () => void;
}) {
  const hoy = obtenerFechaLocalHoy();
  const [disciplinaId, setDisciplinaId] = useState(
    cancha.disciplinas[0]?.id ?? "",
  );
  const [fechaDesde, setFechaDesde] = useState(hoy);
  const [fechaHasta, setFechaHasta] = useState(hoy);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null);

  async function generar() {
    if (enviando) return;

    const errorDeCampos = validarGeneracion({
      disciplinaId,
      fechaDesde,
      fechaHasta,
    });
    if (errorDeCampos) {
      setError(errorDeCampos);
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      const respuesta = await generarTurnos({
        cancha_id: cancha.id,
        disciplina_id: disciplinaId,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      });
      setResultado(respuesta);
      onGenerado();
    } catch (e) {
      setError(mensajeDeErrorAdmin(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="Generar turnos"
        className="w-full max-w-lg rounded-lg border border-neutral-800 bg-white p-6"
      >
        <h2 className="mb-4 text-base font-bold text-neutral-900">
          Generar turnos
        </h2>
        <div className="flex flex-col gap-3">
          <CampoSoloLectura
            id="generar-cancha"
            etiqueta="Cancha"
            valor={cancha.nombre}
          />
          <Campo id="generar-disciplina" etiqueta="Disciplina">
            <select
              id="generar-disciplina"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              disabled={enviando}
              className={CLASES_CONTROL}
            >
              {cancha.disciplinas.length ? null : (
                <option value="">Sin disciplinas</option>
              )}
              {cancha.disciplinas.map((disciplina) => (
                <option key={disciplina.id} value={disciplina.id}>
                  {aEtiquetaDisciplina(disciplina.nombre)}
                </option>
              ))}
            </select>
          </Campo>
          <div className="flex gap-3">
            <Campo id="generar-desde" etiqueta="Fecha desde">
              <input
                id="generar-desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                disabled={enviando}
                className={CLASES_CONTROL}
              />
            </Campo>
            <Campo id="generar-hasta" etiqueta="Fecha hasta">
              <input
                id="generar-hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                disabled={enviando}
                className={CLASES_CONTROL}
              />
            </Campo>
          </div>
          {resultado ? (
            <div
              role="status"
              className="rounded border border-neutral-800 bg-neutral-100 p-3 text-sm text-neutral-900"
            >
              Turnos creados: {resultado.creados}. Turnos salteados:{" "}
              {resultado.salteados}.
            </div>
          ) : null}
          {error ? (
            <div
              role="alert"
              className="rounded border border-neutral-800 bg-neutral-100 p-3 text-sm text-red-600"
            >
              {error}
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
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => void generar()}
            disabled={enviando}
            className={estilosBotonPrincipal(enviando)}
          >
            {enviando ? "Generando..." : "Generar"}
          </button>
        </div>
      </div>
    </div>
  );
}
