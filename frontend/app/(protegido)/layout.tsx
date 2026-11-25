"use client";

import RequiereSesion from "@/app/componentes/requiere-sesion";
import ShellSocio from "@/app/componentes/shell-socio";

export default function LayoutProtegido({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequiereSesion>
      <ShellSocio>{children}</ShellSocio>
    </RequiereSesion>
  );
}
