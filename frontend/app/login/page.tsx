import type { Metadata } from "next";
import Link from "next/link";

import { TarjetaAuth } from "@/app/componentes/auth";
import { FormularioLogin } from "@/app/login/formulario-login";

export const metadata: Metadata = {
  title: "Iniciar sesión",
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
      pie={
        <p className="text-slate-600">
          ¿No tenés cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
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
