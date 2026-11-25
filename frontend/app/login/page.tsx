import type { Metadata } from "next";
import Link from "next/link";

import { TarjetaAuth } from "@/app/componentes/auth";
import { FormularioLogin } from "@/app/login/formulario-login";

export const metadata: Metadata = {
  title: "Iniciar sesión · MatchPoint",
};

type Props = {
  searchParams: Promise<{ redirigir?: string | string[] }>;
};

export default async function PaginaLogin({ searchParams }: Props) {
  const { redirigir } = await searchParams;
  const destino = Array.isArray(redirigir) ? redirigir[0] : redirigir;
  return (
    <TarjetaAuth
      titulo="Iniciar sesión"
      descripcion="Entrá para reservar tu próximo turno y gestionar tus reservas."
      pie={
        <p>
          ¿No tenés cuenta?{" "}
          <Link
            href="/registro"
            className="font-bold text-secondary underline decoration-secondary/30 underline-offset-4 transition hover:decoration-secondary"
          >
            Registrate
          </Link>
        </p>
      }
    >
      <FormularioLogin redirigir={destino} />
    </TarjetaAuth>
  );
}
