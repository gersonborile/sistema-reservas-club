"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { leerClaims, leerToken } from "@/lib/sesion";
import ShellSocio from "@/app/componentes/shell-socio";

export default function LayoutProtegido({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const token = leerToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const claims = leerClaims(token);
    if (!claims) {
      router.replace("/login");
      return;
    }
    setTimeout(() => {
      setAutenticado(true);
      setCargando(false);
    }, 0);
  }, [router]);

  if (cargando) {
    return null;
  }

  if (!autenticado) {
    return null;
  }

  return <ShellSocio>{children}</ShellSocio>;
}