"use client";

import { useEffect } from "react";

import { limpiarDatosHeredados } from "@/lib/almacen-sesion";

/**
 * Borra, una vez por carga de la aplicación, los datos simulados que un
 * navegador pudo conservar de versiones anteriores. No muestra nada.
 */
export default function LimpiezaHeredada() {
  useEffect(() => {
    limpiarDatosHeredados();
  }, []);

  return null;
}
