"use client";

import { useEffect, useState } from "react";

import type { CanchaUI, TurnoUI } from "@/lib/adaptadores";
import {
  aCanchaUI,
  aEtiquetaDisciplina,
  aTurnoUI,
  etiquetaDisciplinas,
  validarDatosTurno,
} from "@/lib/adaptadores";
import {
  crearTurno,
  editarTurno,
  eliminarTurno,
  mensajeDeErrorAdmin,
  obtenerCanchas,
  obtenerTurnos,
} from "@/lib/api";
import {
  formatearFechaAbreviada,
  obtenerFechaLocalHoy,
} from "@/lib/fechas";

import {
  ErrorConReintento,
  ESTILOS_BOTON_SECUNDARIO,
  estilosBotonPrincipal,
  estilosBotonSecundario,
} from "../formulario";
import DialogoEliminar from "./dialogo-eliminar";
import type { CambiosFormularioTurno, FormularioTurno } from "./dialogo-turno";
import DialogoTurno from "./dialogo-turno";

type ResultadoCanchas = {
  clave: number;
  canchas: CanchaUI[];
  error: string | null;
};

type ResultadoTurnos = {
  clave: string;
  filtro: string;
  turnos: TurnoUI[];
  error: string | null;
};

function etiquetaCancha(cancha: CanchaUI): string {
  const disciplinas = etiquetaDisciplinas(cancha);
  return disciplinas ? `${cancha.nombre} · ${disciplinas}` : cancha.nombre;
}

function InsigniaEstadoTurno({ estado }: { estado: TurnoUI["estado"] }) {
  if (estado === "ocupado") {
    return (
      <span className="inline-block rounded border border-neutral-800 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
        Ocupado
      </span>
    );
  }
  return (
    <span className="inline-block rounded border border-neutral-800 bg-white px-2 py-0.5 text-xs font-medium text-neutral-800">
      Libre
    </span>
  );
}

export default function TurnosClient() {
  const [canchasResultado, setCanchasResultado] =
    useState<ResultadoCanchas | null>(null);
  const [intentoCanchas, setIntentoCanchas] = useState(0);
  const [canchaId, setCanchaId] = useState("");
  const [fecha, setFecha] = useState(obtenerFechaLocalHoy());
  const [turnosResultado, setTurnosResultado] =
    useState<ResultadoTurnos | null>(null);
  const [intento, setIntento] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioTurno | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [turnoAEliminar, setTurnoAEliminar] = useState<TurnoUI | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargandoCanchas = canchasResultado?.clave !== intentoCanchas;
  const errorCanchas = canchasResultado?.error ?? null;
  const canchas = canchasResultado?.canchas ?? [];
  const canchaSeleccionada = canchaId || canchas[0]?.id || "";
  const canchaActual =
    canchas.find((cancha) => cancha.id === canchaSeleccionada) ?? null;

  // Sin fecha no se piden turnos: se pide elegir una (no se listan todos).
  const hayFecha = fecha !== "";
  const filtroTurnos = `${canchaSeleccionada}|${fecha}`;
  const claveTurnos = `${filtroTurnos}|${intento}`;
  const hayDatosDelFiltro =
    turnosResultado !== null && turnosResultado.filtro === filtroTurnos;
  const cargandoTurnos =
    canchaSeleccionada !== "" && hayFecha && !hayDatosDelFiltro;
  const actualizandoTurnos =
    hayDatosDelFiltro &&
    turnosResultado !== null &&
    turnosResultado.clave !== claveTurnos;
  const errorTurnos = turnosResultado?.error ?? null;
  const turnos = turnosResultado?.turnos ?? [];
  const ocupado = enviando || eliminando;
  const puedeCrear = !ocupado && canchaActual !== null && hayFecha;

  const nombresDisciplinas: Record<string, string> = {};
  for (const cancha of canchas) {
    for (const disciplina of cancha.disciplinas) {
      nombresDisciplinas[disciplina.id] = aEtiquetaDisciplina(disciplina.nombre);
    }
  }

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const lista = await obtenerCanchas();
        if (cancelado) return;
        setCanchasResultado({
          clave: intentoCanchas,
          canchas: lista.map(aCanchaUI),
          error: null,
        });
      } catch (e) {
        if (cancelado) return;
        setCanchasResultado({
          clave: intentoCanchas,
          canchas: [],
          error: mensajeDeErrorAdmin(e),
        });
      }
    }

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [intentoCanchas]);

  useEffect(() => {
    if (!canchaSeleccionada || !fecha) return;
    let cancelado = false;

    async function cargar() {
      try {
        const lista = await obtenerTurnos({
          canchaId: canchaSeleccionada,
          fecha,
        });
        if (cancelado) return;
        setTurnosResultado({
          clave: claveTurnos,
          filtro: filtroTurnos,
          turnos: lista.map(aTurnoUI),
          error: null,
        });
      } catch (e) {
        if (cancelado) return;
        setTurnosResultado({
          clave: claveTurnos,
          filtro: filtroTurnos,
          turnos: [],
          error: mensajeDeErrorAdmin(e),
        });
      }
    }

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [canchaSeleccionada, fecha, claveTurnos, filtroTurnos]);

  function abrirNuevo() {
    if (!puedeCrear || !canchaActual) return;
    setAviso(null);
    setFormulario({
      id: null,
      disciplinaId: canchaActual.disciplinas[0]?.id ?? "",
      fecha,
      horaInicio: "",
      horaFin: "",
      error: null,
    });
  }

  function abrirEditar(turno: TurnoUI) {
    if (ocupado) return;
    setAviso(null);
    setFormulario({
      id: turno.id,
      disciplinaId: turno.disciplinaId,
      fecha,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      error: null,
    });
  }

  function cambiarFormulario(cambios: CambiosFormularioTurno) {
    setFormulario((prev) => (prev ? { ...prev, ...cambios } : prev));
  }

  function errorEnFormulario(error: string | null) {
    setFormulario((prev) => (prev ? { ...prev, error } : prev));
  }

  async function guardarTurno() {
    if (!formulario || enviando || !canchaSeleccionada) return;

    const errorDeCampos = validarDatosTurno(formulario);
    if (errorDeCampos) {
      errorEnFormulario(errorDeCampos);
      return;
    }

    const datos = {
      disciplina_id: formulario.disciplinaId,
      fecha: formulario.fecha,
      hora_inicio: formulario.horaInicio,
      hora_fin: formulario.horaFin,
    };

    setEnviando(true);
    errorEnFormulario(null);
    try {
      if (formulario.id) {
        await editarTurno(formulario.id, datos);
      } else {
        await crearTurno({ cancha_id: canchaSeleccionada, ...datos });
      }
      setFormulario(null);
      setAviso(null);
      setIntento((n) => n + 1);
    } catch (e) {
      errorEnFormulario(mensajeDeErrorAdmin(e));
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarEliminar() {
    if (!turnoAEliminar || eliminando) return;
    const id = turnoAEliminar.id;
    setEliminando(true);
    setAviso(null);
    try {
      await eliminarTurno(id);
      setTurnoAEliminar(null);
      setIntento((n) => n + 1);
    } catch (e) {
      setAviso(mensajeDeErrorAdmin(e));
      setTurnoAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Turnos y franjas</h1>
      </div>

      {aviso ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded border border-neutral-800 bg-neutral-100 p-3 text-sm text-neutral-900"
        >
          <span className="flex-1">{aviso}</span>
          <button
            type="button"
            onClick={() => setAviso(null)}
            className={ESTILOS_BOTON_SECUNDARIO}
          >
            Cerrar
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-neutral-300 bg-white p-4">
        <div className="flex w-60 flex-col gap-1">
          <label
            htmlFor="cancha"
            className="text-[10px] uppercase tracking-wide text-neutral-500"
          >
            Cancha
          </label>
          <select
            id="cancha"
            value={canchaSeleccionada}
            onChange={(e) => setCanchaId(e.target.value)}
            disabled={ocupado || cargandoCanchas || canchas.length === 0}
            className="h-9 rounded border border-neutral-300 bg-white px-2 text-sm text-neutral-900 disabled:bg-neutral-100"
          >
            {canchas.length === 0 ? <option value="">Sin canchas</option> : null}
            {canchas.map((cancha) => (
              <option key={cancha.id} value={cancha.id}>
                {etiquetaCancha(cancha)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-44 flex-col gap-1">
          <label
            htmlFor="fecha"
            className="text-[10px] uppercase tracking-wide text-neutral-500"
          >
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            disabled={ocupado}
            className="h-9 rounded border border-neutral-300 bg-white px-2 text-sm text-neutral-900 disabled:bg-neutral-100"
          />
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={abrirNuevo}
          disabled={!puedeCrear}
          className={estilosBotonPrincipal(!puedeCrear)}
        >
          + Nuevo turno
        </button>
      </div>

      {cargandoCanchas ? (
        <p className="text-sm text-neutral-500">Cargando canchas...</p>
      ) : errorCanchas ? (
        <ErrorConReintento
          mensaje={errorCanchas}
          reintentando={false}
          onReintentar={() => setIntentoCanchas((n) => n + 1)}
        />
      ) : !canchaSeleccionada ? (
        <div className="rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          No hay canchas disponibles.
        </div>
      ) : !hayFecha ? (
        <div className="rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Elegí una fecha.
        </div>
      ) : cargandoTurnos ? (
        <p className="text-sm text-neutral-500">Cargando turnos...</p>
      ) : errorTurnos ? (
        <ErrorConReintento
          mensaje={errorTurnos}
          reintentando={actualizandoTurnos}
          onReintentar={() => setIntento((n) => n + 1)}
        />
      ) : turnos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-neutral-300 bg-white px-6 py-16">
          <p className="text-sm font-bold text-neutral-900">
            No hay turnos para esta fecha.
          </p>
          <button
            type="button"
            onClick={abrirNuevo}
            disabled={!puedeCrear}
            className={estilosBotonPrincipal(!puedeCrear)}
          >
            + Nuevo turno
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-300 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-[10px] uppercase tracking-wide text-neutral-500">
                <th className="w-36 px-4 py-2 font-medium">Hora inicio</th>
                <th className="w-36 px-4 py-2 font-medium">Hora fin</th>
                <th className="w-52 px-4 py-2 font-medium">Disciplina</th>
                <th className="w-40 px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnos.map((turno) => (
                <tr
                  key={turno.id}
                  className="border-b border-neutral-100 last:border-b-0"
                >
                  <td className="px-4 py-3 text-neutral-900">
                    {turno.horaInicio}
                  </td>
                  <td className="px-4 py-3 text-neutral-900">
                    {turno.horaFin}
                  </td>
                  <td className="px-4 py-3 text-neutral-900">
                    {nombresDisciplinas[turno.disciplinaId] ??
                      turno.disciplinaId}
                  </td>
                  <td className="px-4 py-3">
                    <InsigniaEstadoTurno estado={turno.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(turno)}
                        disabled={ocupado}
                        className={estilosBotonSecundario(ocupado)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAviso(null);
                          setTurnoAEliminar(turno);
                        }}
                        disabled={ocupado}
                        className={estilosBotonSecundario(ocupado)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {actualizandoTurnos ? (
            <p className="border-t border-neutral-100 px-4 py-2 text-xs text-neutral-500">
              Actualizando...
            </p>
          ) : null}
        </div>
      )}

      {formulario ? (
        <DialogoTurno
          formulario={formulario}
          canchaEtiqueta={canchaActual ? etiquetaCancha(canchaActual) : ""}
          disciplinas={canchaActual?.disciplinas ?? []}
          enviando={enviando}
          onCambiar={cambiarFormulario}
          onCancelar={() => setFormulario(null)}
          onGuardar={() => void guardarTurno()}
        />
      ) : null}

      {turnoAEliminar ? (
        <DialogoEliminar
          detalle={`${canchaActual?.nombre ?? "Cancha"} · ${formatearFechaAbreviada(fecha)} · ${turnoAEliminar.horaInicio} a ${turnoAEliminar.horaFin}`}
          eliminando={eliminando}
          onCancelar={() => setTurnoAEliminar(null)}
          onConfirmar={() => void confirmarEliminar()}
        />
      ) : null}
    </div>
  );
}
