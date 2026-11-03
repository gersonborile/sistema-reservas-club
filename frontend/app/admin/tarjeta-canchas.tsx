"use client";

import { useState } from "react";

import type { CanchaUI } from "@/lib/adaptadores";
import {
  aEtiquetaDisciplina,
  disciplinaIdsParaEditar,
  etiquetaDisciplinas,
} from "@/lib/adaptadores";
import type { DisciplinaApi, EstadoCancha } from "@/lib/api";
import {
  ApiError,
  cambiarEstadoCancha,
  crearCancha,
  editarCancha,
  mensajeDeErrorAdmin,
} from "@/lib/api";
import type { CampoInvalido } from "@/lib/tipos";

import {
  camposDeError,
  ErrorDeCampo,
  ESTILOS_BOTON_SECUNDARIO,
  ESTILOS_BOTON_SECUNDARIO_DESHABILITADO,
  estilosBotonPrincipal,
} from "./formulario";

type Props = {
  canchas: CanchaUI[];
  disciplinas: DisciplinaApi[];
  onCanchasCambiadas: () => void;
};

const ESTADO_INICIAL: EstadoCancha = "DISPONIBLE";

export default function TarjetaCanchas({
  canchas,
  disciplinas,
  onCanchasCambiadas,
}: Props) {
  const [creando, setCreando] = useState(false);
  const [nombreCrear, setNombreCrear] = useState("");
  const [ubicacionCrear, setUbicacionCrear] = useState("");
  const [capacidadCrear, setCapacidadCrear] = useState("");
  const [disciplinaCrear, setDisciplinaCrear] = useState("");
  const [camposCrear, setCamposCrear] = useState<CampoInvalido[]>([]);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [guardandoCrear, setGuardandoCrear] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditar, setNombreEditar] = useState("");
  const [ubicacionEditar, setUbicacionEditar] = useState("");
  const [capacidadEditar, setCapacidadEditar] = useState("");
  const [disciplinaEditar, setDisciplinaEditar] = useState("");
  const [camposEditar, setCamposEditar] = useState<CampoInvalido[]>([]);
  const [errorEditar, setErrorEditar] = useState<string | null>(null);
  const [guardandoEditar, setGuardandoEditar] = useState(false);

  const [cambiandoId, setCambiandoId] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const ocupado =
    guardandoCrear || guardandoEditar || cambiandoId !== null;

  function abrirNuevaCancha() {
    setEditandoId(null);
    setNombreCrear("");
    setUbicacionCrear("");
    setCapacidadCrear("");
    setDisciplinaCrear(disciplinas[0]?.id ?? "");
    setCamposCrear([]);
    setErrorCrear(null);
    setCreando(true);
  }

  function abrirEdicion(cancha: CanchaUI) {
    setCreando(false);
    setEditandoId(cancha.id);
    setNombreEditar(cancha.nombre);
    setUbicacionEditar(cancha.ubicacion);
    setCapacidadEditar(String(cancha.capacidad));
    setDisciplinaEditar(cancha.disciplinas[0]?.id ?? "");
    setCamposEditar([]);
    setErrorEditar(null);
  }

  function aCamposDelError(error: unknown, nombreCampoConflicto?: string) {
    const campos = camposDeError(error);
    if (
      campos.length === 0 &&
      error instanceof ApiError &&
      error.status === 409 &&
      nombreCampoConflicto
    ) {
      return [{ campo: nombreCampoConflicto, mensaje: error.message }];
    }
    return campos;
  }

  async function guardarNuevaCancha(
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();
    if (guardandoCrear) return;
    setGuardandoCrear(true);
    setErrorCrear(null);
    setCamposCrear([]);
    try {
      await crearCancha({
        nombre: nombreCrear,
        ubicacion: ubicacionCrear,
        capacidad: Number(capacidadCrear),
        estado: ESTADO_INICIAL,
        disciplinaIds: disciplinaCrear ? [disciplinaCrear] : [],
      });
      setCreando((prev) => (prev ? false : prev));
      onCanchasCambiadas();
    } catch (error) {
      const campos = aCamposDelError(error, "nombre");
      setCamposCrear(campos);
      setErrorCrear(campos.length === 0 ? mensajeDeErrorAdmin(error) : null);
    } finally {
      setGuardandoCrear(false);
    }
  }

  async function guardarEdicion(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!editandoId || guardandoEditar) return;
    const idGuardado = editandoId;
    const cancha = canchas.find((item) => item.id === idGuardado);
    if (!cancha) return;
    const disciplinaIds = disciplinaIdsParaEditar(
      cancha.disciplinas.map((disciplina) => disciplina.id),
      disciplinaEditar,
    );
    setGuardandoEditar(true);
    setErrorEditar(null);
    setCamposEditar([]);
    try {
      await editarCancha(idGuardado, {
        nombre: nombreEditar,
        ubicacion: ubicacionEditar,
        capacidad: Number(capacidadEditar),
        ...(disciplinaIds.length > 0 ? { disciplinaIds } : {}),
      });
      setEditandoId((prev) => (prev === idGuardado ? null : prev));
      onCanchasCambiadas();
    } catch (error) {
      const campos = aCamposDelError(error, "nombre");
      setCamposEditar(campos);
      setErrorEditar(campos.length === 0 ? mensajeDeErrorAdmin(error) : null);
    } finally {
      setGuardandoEditar(false);
    }
  }

  async function alternarActiva(cancha: CanchaUI) {
    if (cambiandoId) return;
    setCambiandoId(cancha.id);
    setErrorAccion(null);
    try {
      await cambiarEstadoCancha(
        cancha.id,
        cancha.activa ? "EN_MANTENIMIENTO" : "DISPONIBLE",
      );
      onCanchasCambiadas();
    } catch (error) {
      setErrorAccion(mensajeDeErrorAdmin(error));
    } finally {
      setCambiandoId(null);
    }
  }

  return (
    <section
      id="canchas"
      className="rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-900">Canchas</h2>
        <button
          type="button"
          disabled={ocupado}
          onClick={abrirNuevaCancha}
          className={estilosBotonPrincipal(ocupado)}
        >
          + Nueva cancha
        </button>
      </div>

      {errorAccion ? (
        <div
          role="alert"
          className="mb-4 rounded border border-neutral-800 bg-neutral-100 p-3 text-sm text-red-600"
        >
          {errorAccion}
        </div>
      ) : null}

      {creando ? (
        <form
          onSubmit={guardarNuevaCancha}
          noValidate
          className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[160px] flex-1">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Nombre
              </span>
              <input
                value={nombreCrear}
                onChange={(evento) => setNombreCrear(evento.target.value)}
                placeholder="Nombre de la cancha"
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
              />
              <ErrorDeCampo campos={camposCrear} campo="nombre" />
            </label>
            <label className="min-w-[140px] flex-1">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Disciplina
              </span>
              <select
                value={disciplinaCrear}
                onChange={(evento) => setDisciplinaCrear(evento.target.value)}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              >
                {disciplinas.map((disciplina) => (
                  <option key={disciplina.id} value={disciplina.id}>
                    {aEtiquetaDisciplina(disciplina.nombre)}
                  </option>
                ))}
              </select>
              <ErrorDeCampo campos={camposCrear} campo="disciplinaIds" />
            </label>
            <label className="min-w-[140px] flex-1">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Ubicación
              </span>
              <input
                value={ubicacionCrear}
                onChange={(evento) => setUbicacionCrear(evento.target.value)}
                placeholder="Sector A"
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
              />
              <ErrorDeCampo campos={camposCrear} campo="ubicacion" />
            </label>
            <label className="min-w-[100px] flex-1">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Capacidad
              </span>
              <input
                type="number"
                min={1}
                value={capacidadCrear}
                onChange={(evento) => setCapacidadCrear(evento.target.value)}
                placeholder="4"
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
              />
              <ErrorDeCampo campos={camposCrear} campo="capacidad" />
            </label>
            <button
              type="submit"
              disabled={guardandoCrear}
              className={estilosBotonPrincipal(guardandoCrear)}
            >
              {guardandoCrear ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              disabled={guardandoCrear}
              onClick={() => setCreando(false)}
              className={
                guardandoCrear
                  ? ESTILOS_BOTON_SECUNDARIO_DESHABILITADO
                  : ESTILOS_BOTON_SECUNDARIO
              }
            >
              Cancelar
            </button>
          </div>
          {errorCrear ? (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {errorCrear}
            </p>
          ) : null}
        </form>
      ) : null}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
            <th className="py-2 pr-2 font-medium">Nombre</th>
            <th className="py-2 pr-2 font-medium">Disciplina</th>
            <th className="py-2 pr-2 font-medium">Ubicación</th>
            <th className="py-2 pr-2 font-medium">Capacidad</th>
            <th className="py-2 pr-2 font-medium">Estado</th>
            <th className="py-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {canchas.map((cancha) =>
            editandoId === cancha.id ? (
              <tr key={cancha.id} className="border-b border-neutral-200">
                <td colSpan={6} className="py-3">
                  <form
                    onSubmit={guardarEdicion}
                    noValidate
                    className="flex flex-wrap items-start gap-3"
                  >
                    <label className="min-w-[160px] flex-1">
                      <span className="mb-1 block text-xs text-neutral-500">
                        Nombre
                      </span>
                      <input
                        value={nombreEditar}
                        onChange={(evento) =>
                          setNombreEditar(evento.target.value)
                        }
                        placeholder="Nombre de la cancha"
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                      />
                      <ErrorDeCampo campos={camposEditar} campo="nombre" />
                    </label>
                    <label className="min-w-[140px] flex-1">
                      <span className="mb-1 block text-xs text-neutral-500">
                        Disciplina
                      </span>
                      <select
                        value={disciplinaEditar}
                        onChange={(evento) =>
                          setDisciplinaEditar(evento.target.value)
                        }
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                      >
                        {disciplinas.map((disciplina) => (
                          <option key={disciplina.id} value={disciplina.id}>
                            {aEtiquetaDisciplina(disciplina.nombre)}
                          </option>
                        ))}
                      </select>
                      <ErrorDeCampo campos={camposEditar} campo="disciplinaIds" />
                    </label>
                    <label className="min-w-[140px] flex-1">
                      <span className="mb-1 block text-xs text-neutral-500">
                        Ubicación
                      </span>
                      <input
                        value={ubicacionEditar}
                        onChange={(evento) =>
                          setUbicacionEditar(evento.target.value)
                        }
                        placeholder="Sector A"
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                      />
                      <ErrorDeCampo campos={camposEditar} campo="ubicacion" />
                    </label>
                    <label className="min-w-[100px] flex-1">
                      <span className="mb-1 block text-xs text-neutral-500">
                        Capacidad
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={capacidadEditar}
                        onChange={(evento) =>
                          setCapacidadEditar(evento.target.value)
                        }
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                      />
                      <ErrorDeCampo campos={camposEditar} campo="capacidad" />
                    </label>
                    <div className="flex gap-2 pt-5">
                      <button
                        type="submit"
                        disabled={guardandoEditar}
                        className={estilosBotonPrincipal(guardandoEditar)}
                      >
                        {guardandoEditar ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        disabled={guardandoEditar}
                        onClick={() => setEditandoId(null)}
                        className={
                          guardandoEditar
                            ? ESTILOS_BOTON_SECUNDARIO_DESHABILITADO
                            : ESTILOS_BOTON_SECUNDARIO
                        }
                      >
                        Cancelar
                      </button>
                    </div>
                    {errorEditar ? (
                      <p
                        role="alert"
                        className="w-full basis-full text-sm text-red-600"
                      >
                        {errorEditar}
                      </p>
                    ) : null}
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={cancha.id} className="border-b border-neutral-200">
                <td className="py-3 pr-2 font-bold text-neutral-900">
                  {cancha.nombre}
                </td>
                <td className="py-3 pr-2 text-neutral-700">
                  {etiquetaDisciplinas(cancha)}
                </td>
                <td className="py-3 pr-2 text-neutral-700">
                  {cancha.ubicacion}
                </td>
                <td className="py-3 pr-2 text-neutral-700">
                  {cancha.capacidad}
                </td>
                <td className="py-3 pr-2">
                  {cancha.activa ? (
                    <span className="inline-block rounded border border-neutral-900 px-2 py-0.5 text-xs font-medium text-neutral-900">
                      Activa
                    </span>
                  ) : (
                    <span className="inline-block rounded border border-neutral-300 px-2 py-0.5 text-xs font-medium text-neutral-500">
                      Inactiva
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => abrirEdicion(cancha)}
                      className={
                        ocupado
                          ? ESTILOS_BOTON_SECUNDARIO_DESHABILITADO
                          : ESTILOS_BOTON_SECUNDARIO
                      }
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={ESTILOS_BOTON_SECUNDARIO}
                    >
                      Franjas
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => void alternarActiva(cancha)}
                      className={
                        ocupado
                          ? ESTILOS_BOTON_SECUNDARIO_DESHABILITADO
                          : ESTILOS_BOTON_SECUNDARIO
                      }
                    >
                      {cancha.activa ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </section>
  );
}
