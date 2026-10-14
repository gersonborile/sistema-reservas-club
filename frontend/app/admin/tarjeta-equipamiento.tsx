"use client";

import { useState } from "react";

import type { Equipamiento } from "@/lib/mock-reservas";
import { actualizarStockEquipamiento } from "@/lib/mock-reservas";

const ERROR_STOCK = "El stock debe ser un entero mayor o igual a 0.";

function mensajeDeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No pudimos guardar los cambios.";
}

type Props = {
  equipamiento: Equipamiento[];
  onEquipamientoCambiado: () => void;
};

export default function TarjetaEquipamiento({
  equipamiento,
  onEquipamientoCambiado,
}: Props) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEnEdicion, setValorEnEdicion] = useState("");
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  function abrirEdicion(item: Equipamiento) {
    setEditandoId(item.id);
    setValorEnEdicion(String(item.stockTotal));
    setErrorEdicion(null);
  }

  function guardar(item: Equipamiento, evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const stock = Number(valorEnEdicion);
    if (valorEnEdicion.trim() === "" || !Number.isInteger(stock) || stock < 0) {
      setErrorEdicion(ERROR_STOCK);
      return;
    }
    try {
      actualizarStockEquipamiento(item.id, stock);
      setEditandoId(null);
      setErrorEdicion(null);
      onEquipamientoCambiado();
    } catch (error) {
      setErrorEdicion(mensajeDeError(error));
    }
  }

  const estilosBotonSecundario =
    "rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50";

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
          className={estilosBotonSecundario}
        >
          + Nuevo
        </button>
      </div>

      <ul>
        {equipamiento.map((item, indice) => (
          <li
            key={item.id}
            className={`flex items-center justify-between gap-3 py-3 ${
              indice > 0 ? "border-t border-neutral-200" : ""
            }`}
          >
            <div>
              <p className="font-medium text-neutral-900">{item.nombre}</p>
              <p className="text-sm text-neutral-500">
                {item.stockTotal} en stock
              </p>
            </div>

            {editandoId === item.id ? (
              <form
                onSubmit={(evento) => guardar(item, evento)}
                noValidate
                className="flex flex-wrap items-center justify-end gap-2"
              >
                <input
                  type="number"
                  min={0}
                  value={valorEnEdicion}
                  onChange={(evento) => setValorEnEdicion(evento.target.value)}
                  className="w-24 rounded border border-neutral-300 px-3 py-1.5 text-right text-sm text-neutral-900 outline-none focus:border-neutral-900"
                />
                <button
                  type="submit"
                  className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
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
                {errorEdicion ? (
                  <p
                    role="alert"
                    className="w-full basis-full text-right text-xs text-red-600"
                  >
                    {errorEdicion}
                  </p>
                ) : null}
              </form>
            ) : (
              <button
                type="button"
                onClick={() => abrirEdicion(item)}
                className={estilosBotonSecundario}
              >
                Editar stock
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}