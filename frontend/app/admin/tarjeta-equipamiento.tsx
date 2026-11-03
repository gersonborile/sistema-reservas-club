"use client";

import { useState } from "react";

import type { EquipamientoUI } from "@/lib/adaptadores";
import { aEtiquetaDisciplina, validarStock } from "@/lib/adaptadores";
import type { DisciplinaApi } from "@/lib/api";
import {
  crearEquipamiento,
  editarEquipamiento,
  mensajeDeErrorAdmin,
} from "@/lib/api";
import type { CampoInvalido } from "@/lib/tipos";

import {
  camposDeError,
  ErrorDeCampo,
  ESTILOS_BOTON_SECUNDARIO,
  ESTILOS_BOTON_SECUNDARIO_DESHABILITADO,
  estilosBotonPrincipal,
  mensajeDeCampo,
} from "./formulario";

type Props = {
  equipamiento: EquipamientoUI[];
  disciplinas: DisciplinaApi[];
  onEquipamientoCambiado: () => void;
};

const ERROR_PRECIO =
  "El precio unitario debe ser un número mayor o igual a 0.";

export default function TarjetaEquipamiento({
  equipamiento,
  disciplinas,
  onEquipamientoCambiado,
}: Props) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEnEdicion, setValorEnEdicion] = useState("");
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [creando, setCreando] = useState(false);
  const [nombreCrear, setNombreCrear] = useState("");
  const [disciplinaCrear, setDisciplinaCrear] = useState("");
  const [stockCrear, setStockCrear] = useState("");
  const [precioCrear, setPrecioCrear] = useState("");
  const [camposCrear, setCamposCrear] = useState<CampoInvalido[]>([]);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [guardandoCrear, setGuardandoCrear] = useState(false);

  const ocupado = guardandoEdicion || guardandoCrear;

  function abrirEdicion(item: EquipamientoUI) {
    setEditandoId(item.id);
    setValorEnEdicion(String(item.stockTotal));
    setErrorEdicion(null);
  }

  function abrirNueva() {
    setEditandoId(null);
    setCreando(true);
    setNombreCrear("");
    setDisciplinaCrear(disciplinas[0]?.id ?? "");
    setStockCrear("");
    setPrecioCrear("");
    setCamposCrear([]);
    setErrorCrear(null);
  }

  async function guardarStock(
    item: EquipamientoUI,
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();
    if (guardandoEdicion) return;
    const validacion = validarStock(valorEnEdicion);
    if (validacion) {
      setErrorEdicion(validacion);
      return;
    }
    const idGuardado = item.id;
    setGuardandoEdicion(true);
    setErrorEdicion(null);
    try {
      await editarEquipamiento(idGuardado, {
        stockTotal: Number(valorEnEdicion),
      });
      setEditandoId((prev) => (prev === idGuardado ? null : prev));
      onEquipamientoCambiado();
    } catch (error) {
      const mensaje = mensajeDeCampo(camposDeError(error), "stockTotal");
      setErrorEdicion(mensaje ?? mensajeDeErrorAdmin(error));
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function guardarNuevo(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardandoCrear) return;
    setCamposCrear([]);
    setErrorCrear(null);

    const validacionStock = validarStock(stockCrear);
    if (validacionStock) {
      setErrorCrear(validacionStock);
      return;
    }
    const precio = Number(precioCrear);
    if (precioCrear.trim() === "" || !Number.isFinite(precio) || precio < 0) {
      setCamposCrear([{ campo: "precioUnitario", mensaje: ERROR_PRECIO }]);
      return;
    }

    setGuardandoCrear(true);
    try {
      await crearEquipamiento({
        nombre: nombreCrear,
        disciplinaId: disciplinaCrear,
        stockTotal: Number(stockCrear),
        precioUnitario: precio,
      });
      setCreando((prev) => (prev ? false : prev));
      onEquipamientoCambiado();
    } catch (error) {
      const campos = camposDeError(error);
      setCamposCrear(campos);
      setErrorCrear(campos.length === 0 ? mensajeDeErrorAdmin(error) : null);
    } finally {
      setGuardandoCrear(false);
    }
  }

  return (
    <section
      id="equipamiento"
      className="rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-900">
          Equipamiento
        </h2>
        <button
          type="button"
          disabled={ocupado}
          onClick={abrirNueva}
          className={
            ocupado
              ? ESTILOS_BOTON_SECUNDARIO_DESHABILITADO
              : ESTILOS_BOTON_SECUNDARIO
          }
        >
          + Nuevo
        </button>
      </div>

      {creando ? (
        <form
          onSubmit={guardarNuevo}
          noValidate
          className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="flex flex-wrap items-start gap-3">
            <label className="min-w-[160px] flex-1">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Nombre
              </span>
              <input
                value={nombreCrear}
                onChange={(evento) => setNombreCrear(evento.target.value)}
                placeholder="Nombre del equipamiento"
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
              <ErrorDeCampo campos={camposCrear} campo="disciplinaId" />
            </label>
            <label className="min-w-[100px] flex-1">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Stock total
              </span>
              <input
                type="number"
                min={0}
                value={stockCrear}
                onChange={(evento) => setStockCrear(evento.target.value)}
                placeholder="12"
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
              />
              <ErrorDeCampo campos={camposCrear} campo="stockTotal" />
            </label>
            <label className="min-w-[120px] flex-1">
              <span className="mb-1 block text-sm font-medium text-neutral-700">
                Precio unitario
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={precioCrear}
                onChange={(evento) => setPrecioCrear(evento.target.value)}
                placeholder="1500"
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
              />
              <ErrorDeCampo campos={camposCrear} campo="precioUnitario" />
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2 pr-2 font-medium">Nombre</th>
              <th className="py-2 pr-2 font-medium">Disciplina</th>
              <th className="py-2 pr-2 font-medium">Stock total</th>
              <th className="py-2 pr-2 font-medium">Precio unitario</th>
              <th className="py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {equipamiento.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200">
                <td className="py-3 pr-2 font-bold text-neutral-900">
                  {item.nombre}
                </td>
                <td className="py-3 pr-2 text-neutral-700">
                  {aEtiquetaDisciplina(item.disciplinaNombre)}
                </td>
                <td className="py-3 pr-2 text-neutral-700">
                  {item.stockTotal} en stock
                </td>
                <td className="py-3 pr-2 text-neutral-700">
                  $ {item.precioUnitario.toLocaleString("es-AR")}
                </td>
                <td className="py-3">
                  {editandoId === item.id ? (
                    <form
                      onSubmit={(evento) => void guardarStock(item, evento)}
                      noValidate
                      className="flex flex-wrap items-start justify-end gap-2"
                    >
                      <div>
                        <input
                          type="number"
                          min={0}
                          value={valorEnEdicion}
                          onChange={(evento) =>
                            setValorEnEdicion(evento.target.value)
                          }
                          aria-label={`Stock total de ${item.nombre}`}
                          className="w-24 rounded border border-neutral-300 px-3 py-1.5 text-right text-sm text-neutral-900 outline-none focus:border-neutral-900"
                        />
                        {errorEdicion ? (
                          <p
                            role="alert"
                            className="mt-1 text-right text-xs text-red-600"
                          >
                            {errorEdicion}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="submit"
                        disabled={guardandoEdicion}
                        className={estilosBotonPrincipal(guardandoEdicion)}
                      >
                        {guardandoEdicion ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        disabled={guardandoEdicion}
                        onClick={() => setEditandoId(null)}
                        className={
                          guardandoEdicion
                            ? ESTILOS_BOTON_SECUNDARIO_DESHABILITADO
                            : ESTILOS_BOTON_SECUNDARIO
                        }
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => abrirEdicion(item)}
                        className={
                          ocupado
                            ? ESTILOS_BOTON_SECUNDARIO_DESHABILITADO
                            : ESTILOS_BOTON_SECUNDARIO
                        }
                      >
                        Editar stock
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
