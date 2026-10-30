"use client";

import { useSesion } from "@/lib/use-sesion";
import ShellSocio from "@/app/componentes/shell-socio";
import Landing from "@/app/componentes/landing";
import HomeClient from "@/app/home-client";

export default function InicioClient() {
  const { cargando, claims } = useSesion({ redirigirSinSesion: false });

  if (cargando) {
    return null;
  }

  if (!claims) {
    return <Landing />;
  }

  return (
    <ShellSocio>
      <HomeClient />
    </ShellSocio>
  );
}
