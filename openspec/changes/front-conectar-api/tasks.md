# Tasks

## 1. Capa de datos y adaptadores

- [x] 1.1 Extender `DisciplinaApi` con `duracionTipicaMinutos` y `reglas` opcionales, y tipar los helpers de turnos por recurso; verificar con `npm run typecheck`.
- [x] 1.2 Agregar en `lib/adaptadores.ts` helpers para agrupar turnos por cancha, filtrar turnos libres desde una hora y contar libres por disciplina; verificar con tests Vitest.
- [x] 1.3 Agregar en `lib/fechas.ts` el cálculo de fecha de mañana y una etiqueta "hoy/mañana"; verificar con tests Vitest.
- [x] 1.4 Agregar `rutaRetornoSegura` en `lib/navegacion.ts` y sus tests para rechazar URLs externas; verificar con `npm test`.

## 2. Rutas públicas y retorno de sesión

- [x] 2.1 Mover `app/(protegido)/canchas` a `app/canchas` y crear el layout público con navbar que tolere visitantes; verificar que `/canchas` renderice sin token.
- [x] 2.2 Agregar un guard de sesión para `app/canchas/[id]/reservar` que redirija a `/login?redirigir=<ruta>`; verificar que sin token no muestre la pantalla de reserva.
- [x] 2.3 Actualizar `lib/api.ts` para conservar la ruta actual en el `redirigir` del `401`; verificar con el test de `api.test.ts`.
- [x] 2.4 Actualizar `FormularioLogin` para leer y validar `redirigir`; verificar con `rutaRetornoSegura` y una prueba manual de login.

## 3. Home pública

- [x] 3.1 Conectar `Landing` a `GET /disciplinas`, mostrando `reglas` o duración real y sin listas fijas; verificar que un fallo muestre reintento.
- [x] 3.2 Reemplazar el horario por la constante única `APERTURA`/`CIERRE` (08:00–22:00) en landing y footer; verificar que el texto coincida.
- [x] 3.3 Hacer que "Reservar" y "Ver disponibilidad" naveguen a `/canchas`; verificar los enlaces en la Home pública.

## 4. Home autenticada

- [x] 4.1 Actualizar `useSesion` para mostrar el usuario guardado y refrescar `GET /auth/perfil` en segundo plano; verificar que el nombre se actualice.
- [x] 4.2 Hacer que `InicioClient` elija Landing o Home según la sesión; verificar `/` sin token y con token.
- [x] 4.3 Conectar saludo, próxima reserva y accesos rápidos a perfil, `/reservas/mis` y `/disciplinas`; verificar que no queden textos ni cantidades fijas.
- [x] 4.4 Conectar "Canchas con turnos libres" con `GET /turnos?fecha=`, agrupando por cancha y pasando a mañana si hoy no hay libres; verificar con datos reales y con la fecha sin turnos.
- [x] 4.5 Implementar skeleton, vacío y error con reintento en la Home; verificar los tres estados.
- [x] 4.6 Quitar precios, amenities, QR, check-in, "Socio Activo #N", notificaciones y datos de contacto inventados de Home/navbar/footer; verificar por búsqueda en el código.

## 5. Listado público de canchas

- [x] 5.1 Reemplazar las llamadas por cancha por `GET /canchas` + un único `GET /turnos?fecha=`; verificar que no haya una petición por cancha.
- [x] 5.2 Conectar filtros de disciplina, fecha y horario; verificar que cambiar filtros actualice canchas y franjas.
- [x] 5.3 Distinguir turnos libres y ocupados y redirigir a login con retorno al elegir uno sin sesión; verificar ambos casos.
- [x] 5.4 Implementar skeleton, vacío "No hay turnos cargados para esta fecha" y error con reintento; verificar los tres estados.

## 6. Reservar y Mis reservas

- [x] 6.1 Manejar `409`, `400` y `401` al confirmar con `POST /reservas`; verificar cada mensaje.
- [x] 6.2 Navegar a `/reservas?reserva=creada` al confirmar y mostrar el aviso de éxito en Mis reservas; verificar el flujo completo.
- [x] 6.3 Mantener el flujo de alquiler y su reintento, navegando a Mis reservas tras el éxito; verificar reserva con y sin equipamiento.
- [x] 6.4 Agregar skeleton y estados vacío/error consistentes en reservar y Mis reservas; verificar visualmente y con `npm run build`.

## 7. Documentación y entorno local

- [ ] 7.1 Agregar `docker-compose.local.yml` con los puertos 5432 y 3001 para desarrollo; verificar con `docker compose -f docker-compose.yml -f docker-compose.local.yml config`.
  - Nota: el archivo está creado; no se pudo ejecutar la verificación porque Docker no está instalado en este entorno.
- [x] 7.2 Documentar en `frontend/README.md` variables, arranque de base y backend, migraciones, seed, usuarios de prueba y generación de turnos desde `/admin/turnos`; verificar que los comandos existan en los `package.json`.
- [x] 7.3 Documentar que `NEXT_PUBLIC_API_URL` en producción incluye `/api` porque Caddy quita el prefijo; verificar la tabla de entornos.

## 8. Integración final

- [x] 8.1 Ejecutar `openspec validate --all --strict --no-interactive` y corregir cualquier error.
- [x] 8.2 Ejecutar `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en `frontend` y dejarlos en verde.
- [x] 8.3 Revisar que no queden `setTimeout` de simulación, arrays de canchas/disciplinas/precios ni endpoints inventados; verificar con búsqueda global.
