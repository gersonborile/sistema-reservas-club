## 1. Backend: errores de validación con campo

- [x] 1.1 Agregar `exceptionFactory` a `comun/validation-pipe.ts` que arme `campos: [{ campo, mensaje }]` (propiedades anidadas con notación de puntos) y conserve `statusCode`, `error` y `message`, y verificar con unit tests los cuatro escenarios de `specs/validation-errors/spec.md`
- [x] 1.2 Verificar con e2e que `POST /auth/login` y `POST /auth/register` con datos inválidos devuelven `400` con `campos` y que el `message` no cambió, y que `npm run test` y `npm run test:e2e` siguen verdes

## 2. Frontend: cliente HTTP y sesión

- [x] 2.1 Reescribir `lib/api.ts` con `BASE_URL` desde `NEXT_PUBLIC_API_URL` (default `http://localhost:3001` solo en desarrollo), la función `peticion<T>` (Bearer, JSON, `ApiError` con `status`/`mensaje`/`campos`, fallo de red → status 0) y verificar con typecheck que compila
- [x] 2.2 Implementar `registrar`, `iniciarSesion` y `obtenerPerfil` con `POST /auth/register`, `POST /auth/login` y `GET /auth/perfil`; traducir el rol en un único punto (`aRolFront`) y normalizar `contacto` nulo; guardar token y usuario al iniciar sesión; eliminar el administrador semilla, el token mock y el almacenamiento de usuarios mock
- [x] 2.3 Ajustar `lib/sesion.ts` y `lib/tipos.ts`: `leerClaims` valida `userId`, `email` y `rol` (mayúscula) sin exigir `nombre`; el nombre sale del usuario guardado; actualizar los layouts `(protegido)` y `admin` y la navbar que lo usan
- [x] 2.4 Implementar el manejo global de `401` (borrar sesión y navegar a `/login`) sin afectar el `401` de `POST /auth/login`
- [x] 2.5 Ajustar `formulario-login.tsx` y `formulario-registro.tsx` para mostrar `campos` junto a cada campo, el `409` en `email` y el error general cuando no hay campos
- [x] 2.6 Documentar `NEXT_PUBLIC_API_URL` en `frontend/README.md` y agregar `frontend/.env.example` (local `http://localhost:3001`, producción `https://matchpoint.alquilerespunilla.com.ar/api`)

## 3. Integración y verificación

- [x] 3.1 Correr `typecheck`, `lint` y `build` del frontend y `npm run test` / `npm run test:e2e` del backend y verificar que terminan sin errores
- [x] 3.2 Con backend y Postgres locales, recorrer a mano registro → login de socio → pantalla protegida → logout y login de administrador → panel admin, y verificar los escenarios de `specs/frontend-api-client/spec.md` (incluido `401` por token vencido y credenciales inválidas)
- [ ] 3.3 Tras el deploy, verificar en `https://matchpoint.alquilerespunilla.com.ar` que registro y login funcionan contra el backend de producción
