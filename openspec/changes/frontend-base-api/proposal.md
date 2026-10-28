## Why

El frontend funciona entero con datos simulados: `lib/api.ts` falsifica login, registro y perfil con `localStorage` y un token con firma `mock-firma`. Antes de conectar canchas, reservas o el panel admin hace falta una base común contra el backend real: un cliente HTTP, la URL correcta por entorno y la autenticación real. Sin esto, cada pantalla reinventaría el manejo de token y de errores.

Hay tres desajustes concretos entre el front y el backend que este change resuelve:
- **URL base**: el front asume `http://localhost:3001/api/v1`, pero el backend no tiene prefijo global (las rutas son `/auth/login`, `/reservas`, etc.). En producción Caddy quita `/api` y `NEXT_PUBLIC_API_URL` ya vale `https://matchpoint.alquilerespunilla.com.ar/api`.
- **Token**: el JWT real lleva `userId`, `email` y `rol` (`USUARIO` / `ADMINISTRADOR`), sin `nombre`. El front exige `nombre` y espera roles en minúscula, así que rechazaría cualquier token real.
- **Errores de validación**: Nest responde `400` con `message: string[]` sin indicar el campo, y los formularios muestran el error junto a cada campo.

## What Changes

- Nuevo cliente HTTP del frontend (`lib/api.ts`) basado en `fetch`: agrega `Authorization: Bearer`, parsea JSON y traduce errores a `ApiError` (`status`, `mensaje`, `campos`).
- `registrar`, `iniciarSesion` y `obtenerPerfil` pasan a llamar a `POST /auth/register`, `POST /auth/login` y `GET /auth/perfil`. Se elimina el usuario semilla `admin@club.com`, el token mock y el almacenamiento de usuarios en `localStorage`.
- El rol del backend (`USUARIO` / `ADMINISTRADOR`) se traduce a `usuario` / `administrador` en un único punto del front. El nombre del usuario sale de la respuesta de login / perfil, no del token.
- `leerClaims` deja de exigir `nombre` en el token.
- Una respuesta `401` en una petición autenticada borra el token y redirige a `/login`.
- Backend: el `ValidationPipe` global agrega `campos: [{ campo, mensaje }]` al `400`, conservando `message` y `statusCode` (cambio aditivo, no rompe a otros consumidores).
- `BASE_URL`: se documenta `NEXT_PUBLIC_API_URL` (`http://localhost:3001` en local, `https://matchpoint.alquilerespunilla.com.ar/api` en producción) y se quita el default con `/api/v1`.

## Capabilities

### New Capabilities
- `frontend-api-client`: cliente HTTP del frontend con URL por entorno, token, errores tipados, traducción de roles y sesión real contra `/auth/*`.
- `validation-errors`: el `400` de validación del backend identifica el campo de cada error.

### Modified Capabilities
- Ninguna. Las specs `auth-registro-login` y `frontend-login` siguen vigentes en lo funcional; este change solo cambia su fuente de datos de simulada a real.

## Impact

- **Frontend**: `lib/api.ts`, `lib/sesion.ts`, `lib/tipos.ts`, `app/login/formulario-login.tsx`, `app/registro/formulario-registro.tsx`, layouts `(protegido)` y `admin`, navbar. `mock-reservas.ts` no se toca (lo retira el último change de la serie).
- **Backend**: `comun/validation-pipe.ts` y sus tests.
- **Infra**: sin cambios; `CORS_ORIGIN` y `NEXT_PUBLIC_API_URL` de producción ya están bien. Local: `backend/.env` con `CORS_ORIGIN=http://localhost:3000` (ya es el default).
- **Rollback**: revertir el PR; el front vuelve a los datos simulados.

## Dependencies

- Requiere `auth-registro-login` (endpoints `/auth/*`), ya en `main`.
- Es el primer change de la serie de conexión front–back: canchas y disponibilidad, reservar y mis reservas, panel admin, retiro de mocks.
