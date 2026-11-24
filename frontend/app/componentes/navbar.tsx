"use client";

import NavbarPrincipal from "@/app/componentes/ui/navbar-principal";
import { useSesion } from "@/lib/use-sesion";

export default function Navbar() {
  const { usuario, cargando } = useSesion({ redirigirSinSesion: false });

  return <NavbarPrincipal usuario={usuario} cargando={cargando} />;
}
