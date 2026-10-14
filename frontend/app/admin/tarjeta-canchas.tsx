"use client";

import { useState } from "react";

import type { Cancha, Disciplina } from "@/lib/mock-reservas";
import {
  cambiarActivaCancha,
  crearCancha,
  editarCancha,
} from "@/lib/mock-reservas";

const DISCIPLINAS: Disciplina[] = ["Tenis", "Fútbol 5", "Pádel"];

function mensajeDeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No pudimos guardar los cambios.";
}

type Props = {
  canchas: Cancha[];
  onCanchasCambiadas: () => void;
};

export default function TarjetaCanchas({ canchas, onCanchasCambiadas }: Props) {
  const [creando, setCreando] = useState(false);
  const [nombreCrear, setNombreCrear] = useState("");
  const [disciplinaCrear, setDisciplinaCrear] = useState<Disciplina>("Tenis");
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditar, setNombreEditar] = useState("");
  const [disciplinaEditar, setDisciplinaEditar] = useState<Disciplina>("Tenis");
  const [errorEditar, setErrorEditar] = useState<string | null>(null);

  function abrirNuevaCancha() {
    setEditandoId(null);
    setNombreCrear("");
    setDisciplinaCrear("Tenis");
    setErrorCrear(null);
    setCreando(true);
  }

  function abrirEdicion(cancha: Cancha) {
    setCreando(false);
    setEditandoId(cancha.id);
    setNombreEditar(cancha.nombre);
    setDisciplinaEditar(cancha.disciplina);
    setErrorEditar(null);
  }

  function guardarNuevaCancha(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    try {
      crearCancha({ nombre: nombreCrear, disciplina: disciplinaCrear });
      setCreando(false);
      setErrorCrear(null);
      onCanchasCambiadas();
    } catch (error) {
      setErrorCrear(mensajeDeError(error));
    }
  }

  function guardarEdicion(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!editandoId) return;
    try {
      editarCancha(editandoId, {
        nombre: nombreEditar,
        disciplina: disciplinaEditar,
      });
      setEditandoId(null);
      setErrorEditar(null);
      onCanchasCambiadas();
    } catch (error) {
      setErrorEditar(mensajeDeError(error));
    }
  }

  function alternarActiva(cancha: Cancha) {
    try {
      cambiarActivaCancha(cancha.id, !cancha.activa);
      onCanchasCambiadas();
    } catch {
      // La cancha desapareció del catálogo; se ignoran los cambios.
    }
  }

  const estilosBotonSecundario =
    "rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50";

  return (
    <section
      id="canchas"
      className="rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-900">Canchas</h2>
        <button
          type="button"
          onClick={abrirNuevaCancha}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Nueva cancha
        </button>
      </div>

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
            </label>
            <label className="min-w-[140px] flex-1">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Disciplina
              </span>
              <select
                value={disciplinaCrear}
                onChange={(evento) =>
                  setDisciplinaCrear(evento.target.value as Disciplina)
                }
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              >
                {DISCIPLINAS.map((disciplina) => (
                  <option key={disciplina} value={disciplina}>
                    {disciplina}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setCreando(false)}
              className={estilosBotonSecundario}
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
            <th className="py-2 pr-2 font-medium">Estado</th>
            <th className="py-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {canchas.map((cancha) =>
            editandoId === cancha.id ? (
              <tr key={cancha.id} className="border-b border-neutral-200">
                <td colSpan={4} className="py-3">
                  <form
                    onSubmit={guardarEdicion}
                    noValidate
                    className="flex flex-wrap items-end gap-3"
                  >
                    <input
                      value={nombreEditar}
                      onChange={(evento) => setNombreEditar(evento.target.value)}
                      placeholder="Nombre de la cancha"
                      className="min-w-[160px] flex-1 rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                    />
                    <select
                      value={disciplinaEditar}
                      onChange={(evento) =>
                        setDisciplinaEditar(evento.target.value as Disciplina)
                      }
                      className="min-w-[140px] flex-1 rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                    >
                      {DISCIPLINAS.map((disciplina) => (
                        <option key={disciplina} value={disciplina}>
                          {disciplina}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoId(null)}
                      className={estilosBotonSecundario}
                    >
                      Cancelar
                    </button>
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
                  {cancha.disciplina}
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
                      onClick={() => abrirEdicion(cancha)}
                      className={estilosBotonSecundario}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={estilosBotonSecundario}
                    >
                      Franjas
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarActiva(cancha)}
                      className={estilosBotonSecundario}
                    >
                      {cancha.activa ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </section>
  );
}