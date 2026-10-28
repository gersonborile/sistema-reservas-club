export type Rol = "usuario" | "administrador";

export type RolBackend = "USUARIO" | "ADMINISTRADOR";

export function esRol(valor: unknown): valor is Rol {
  return valor === "usuario" || valor === "administrador";
}

export function esRolBackend(valor: unknown): valor is RolBackend {
  return valor === "USUARIO" || valor === "ADMINISTRADOR";
}

/** Traduce el rol del backend al rol que usa el frontend. */
export function aRolFront(rol: RolBackend): Rol {
  return rol === "ADMINISTRADOR" ? "administrador" : "usuario";
}

export type UsuarioPublico = {
  id: string;
  nombre: string;
  contacto: string;
  email: string;
  rol: Rol;
};

export type DatosRegistro = {
  nombre: string;
  contacto: string;
  email: string;
  contrasena: string;
};

export type DatosLogin = {
  email: string;
  contrasena: string;
};

export type SesionAutenticada = {
  token: string;
  usuario: UsuarioPublico;
};

export type CampoInvalido = {
  campo: string;
  mensaje: string;
};

export type SesionEnToken = {
  userId: string;
  email: string;
  rol: Rol;
};
