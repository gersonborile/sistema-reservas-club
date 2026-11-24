"use client";

import NavbarPrincipal from "@/app/componentes/ui/navbar-principal";
import type { UsuarioPublico } from "@/lib/tipos";

export default function NavbarHome({
  usuario,
}: {
  usuario: UsuarioPublico | null;
}) {
  return <NavbarPrincipal usuario={usuario} />;
}
