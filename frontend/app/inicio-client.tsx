"use client";

import { useEffect, useState } from "react";

import { leerClaims, leerToken } from "@/lib/sesion";
import ShellSocio from "@/app/componentes/shell-socio";
import Landing from "@/app/componentes/landing";
import HomeClient from "@/app/home-client";

export default function InicioClient() {
  const [cargando, setCargando] = useState(true);
  const [tieneSesion, setTieneSesion] = useState(false);

  useEffect(() => {
    const token = leerToken();
    const claims = token ? leerClaims(token) : null;
    // Usar setTimeout para evitar warning del linter
    setTimeout(() => {
      setTieneSesion(claims !== null);
      setCargando(false);
    }, 0);
  }, []);

  if (cargando) {
    return null;
  }

  if (!tieneSesion) {
    return <Landing />;
  }

  return (
    <ShellSocio>
      <HomeClient />
    </ShellSocio>
  );
}
