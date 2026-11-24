import type { Metadata } from "next";
import Link from "next/link";

import { TarjetaAuth } from "@/app/componentes/auth";
import { FormularioRegistro } from "@/app/registro/formulario-registro";

export const metadata: Metadata = {
  title: "Crear cuenta · MatchPoint",
};

export default function PaginaRegistro() {
  return (
    <TarjetaAuth
      titulo="Crear cuenta"
      descripcion="En pocos pasos vas a poder elegir cancha, turno y equipamiento."
      pie={
        <p>
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-bold text-secondary underline decoration-secondary/30 underline-offset-4 transition hover:decoration-secondary"
          >
            Iniciá sesión
          </Link>
        </p>
      }
    >
      <FormularioRegistro />
    </TarjetaAuth>
  );
}
