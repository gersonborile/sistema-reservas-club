"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Aviso, Campo } from "@/app/componentes/auth";
import { ApiError, iniciarSesion } from "@/lib/api";
import { guardarToken } from "@/lib/sesion";
import type { CampoInvalido } from "@/lib/tipos";

export function FormularioLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errores, setErrores] = useState<CampoInvalido[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrores([]);
    setMensaje(null);
    setEnviando(true);

    try {
      const sesion = await iniciarSesion({ email, contrasena });
      if (!guardarToken(sesion.token)) {
        setMensaje("No pudimos guardar la sesión en este navegador.");
        setEnviando(false);
        return;
      }
      router.push(sesion.usuario.rol === "administrador" ? "/admin" : "/");
    } catch (error) {
      if (error instanceof ApiError) {
        setMensaje(error.message);
        setErrores(error.campos);
      } else {
        setMensaje("No pudimos iniciar sesión. Intentá de nuevo.");
      }
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="flex flex-col gap-4">
      {mensaje ? <Aviso tono="error">{mensaje}</Aviso> : null}

      <Campo
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="tu@email.com"
        value={email}
        error={errores.find((error) => error.campo === "email")?.mensaje}
        onChange={setEmail}
      />

      <Campo
        id="contrasena"
        name="contrasena"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={contrasena}
        error={errores.find((error) => error.campo === "contrasena")?.mensaje}
        onChange={setContrasena}
      />

      <button
        type="submit"
        disabled={enviando}
        className="mt-2 w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
