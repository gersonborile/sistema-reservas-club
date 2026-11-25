"use client";

import HomeClient from "@/app/home-client";
import Landing from "@/app/componentes/landing";
import { useSesion } from "@/lib/use-sesion";

export default function InicioClient() {
  const { cargando, usuario } = useSesion({ redirigirSinSesion: false });

  if (cargando) {
    return (
      <div className="min-h-screen bg-surface px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="h-9 w-40 animate-pulse rounded-lg bg-surface-container" />
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-surface-container" />
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Landing />;
  }

  return <HomeClient usuario={usuario} />;
}
