## Context

El backend corre sin prefijo global; en producción Caddy sirve el front en `/` y el backend en `/api/*` (`handle_path` quita `/api`). El token de sesión es un JWT real con claims `userId`, `email`, `rol`. Los formularios del front (`login`, `registro`) pintan el error debajo de cada campo a partir de `ApiError.campos`.

## Goals / Non-Goals

**Goals:**
- Una sola capa HTTP que el resto de los changes reutilice.
- Login, registro y perfil reales, con la sesión persistida como hoy (`localStorage`).
- Que los formularios sigan mostrando errores por campo sin reescribir la UI.

**Non-Goals:**
- Conectar canchas, reservas, equipamiento o panel admin (changes siguientes).
- Refresh tokens, cookies `httpOnly` o logout en el servidor.
- Tests automatizados del frontend (no hay runner configurado; se verifica con typecheck, lint, build y recorrido manual).

## Decisions

- **Capa HTTP**: una función `peticion<T>(ruta, opciones)` en `lib/api.ts` que arma `${BASE_URL}${ruta}`, agrega `Content-Type` y `Authorization` si hay token, y en respuestas no `2xx` lanza `ApiError(status, mensaje, campos)`. Las funciones de dominio (`iniciarSesion`, etc.) la usan; los changes siguientes agregan las suyas.
- **Mensaje y campos del error**: si el cuerpo trae `campos`, se usan tal cual; `mensaje` es `message` (si es string) o `message[0]` (si es arreglo). Un fallo de red (`fetch` rechaza) se traduce a `ApiError(0, "No se pudo conectar con el servidor.")`.
- **`campos` en el backend**: se agrega `exceptionFactory` al `ValidationPipe` compartido (`comun/validation-pipe.ts`) que devuelve `BadRequestException({ statusCode: 400, error: 'Bad Request', message: string[], campos: [{ campo, mensaje }] })`. Es aditivo: `message` no cambia. Se prefiere esto a inferir el campo en el front desde el texto del mensaje, que es frágil. Los DTO anidados usan la ruta con puntos (`items.0.cantidad`).
- **Roles**: función única `aRolFront(rol: "USUARIO" | "ADMINISTRADOR"): Rol` en `lib/api.ts`; `UsuarioPublico` del front mantiene `rol: "usuario" | "administrador"` para no tocar guards ni navbar. `contacto` nulo del backend se normaliza a `""`.
- **Token y nombre**: `leerClaims` valida `userId`, `email` y `rol` (en mayúscula) y deja de exigir `nombre`. El nombre del usuario se guarda junto al token (`clubDeportivo.usuario`, JSON con el `UsuarioPublico`) al iniciar sesión y se refresca con `obtenerPerfil`. Se evita decodificar más datos del token.
- **401 global**: `peticion` ante `401` en una llamada con token borra token y usuario guardados y navega a `/login` (`window.location.assign`). El `401` de `POST /auth/login` (credenciales inválidas) NO dispara esto: se distingue por no haber enviado token.
- **URL base**: `BASE_URL = process.env.NEXT_PUBLIC_API_URL`, sin default con `/api/v1`. Si falta, se usa `http://localhost:3001` solo en desarrollo (`NODE_ENV !== "production"`); en producción un valor ausente es un error de build/configuración. Se documenta en `frontend/README.md` y `frontend/.env.example`.
- **Lo que no se borra**: `mock-reservas.ts` y sus consumidores siguen igual; se retiran en el último change de la serie. El usuario semilla del mock de auth sí se elimina porque ya existe un administrador real en la base (seed).

## Risks / Trade-offs

- [CORS en local] El front en `localhost:3000` llama al back en `localhost:3001` → `CORS_ORIGIN` ya vale `http://localhost:3000` por defecto. En producción es mismo origen vía Caddy.
- [Token en `localStorage`] Es lo que ya hace el front; queda expuesto a XSS. Se acepta para el alcance de la materia y se anota como límite.
- [Fallo de validación sin campo] Si un `400` no trae `campos` (otro origen de error), el formulario muestra solo el mensaje general. Se muestra en el encabezado del formulario.
