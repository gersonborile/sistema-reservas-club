# Design

## Context

Ver `proposal.md`. La UI nueva de la Home ya existe, pero el resto de las pantallas conserva el diseño anterior y algunas rutas siguen dentro de `(protegido)`. `lib/api.ts` ya expone funciones tipadas para todos los recursos necesarios; `lib/adaptadores.ts` ya normaliza reservas, canchas, turnos y equipamiento. El backend confirma que `cancha_id` es opcional en `GET /turnos` y que `GET /turnos` devuelve libres y ocupados. El backend no expone precios de cancha, imágenes, ratings, números de socio ni datos de contacto.

## Goals / Non-Goals

**Goals:**
- Conectar Home pública, Home autenticada, `/canchas`, reservar y Mis reservas al backend real.
- Reutilizar `lib/api.ts` y `lib/adaptadores.ts`; agregar solo helpers de agrupación, fechas y navegación segura.
- Mantener el diseño visual existente y reemplazar únicamente los datos y acciones sin respaldo.
- Dejar estados de carga, vacío y error en todas las vistas tocadas.

**Non-Goals:**
- Cambiar el backend o el modelo de datos.
- Agregar precios, imágenes, pagos online o recuperación de contraseña.
- Migrar la sesión de `localStorage` a cookies o middleware.
- Rediseñar visualmente `/canchas`, reservar o Mis reservas.

## Decisions

### Rutas públicas y protegidas
- Mover `app/(protegido)/canchas` a `app/canchas` para que el listado sea público.
- Crear `app/canchas/layout.tsx` con el `ShellSocio`/navbar existente, adaptado para mostrar "Iniciar sesión"/"Registrate" cuando no hay sesión.
- Mantener `/reservas` dentro de `(protegido)`.
- Envolver `app/canchas/[id]/reservar` con un componente `RequiereSesion` que redirige a `/login?redirigir=<ruta actual>` si no hay token o claims válidos.
- Alternativa descartada: dejar `/canchas` dentro de `(protegido)` y hacer que el layout detecte la ruta. Acopla el guard al pathname y mantiene una ruta pública dentro de un grupo llamado "protegido".

### Obtención de turnos
- Home: una llamada `GET /turnos?fecha=<hoy>`; si no hay libres desde la hora actual, una llamada `GET /turnos?fecha=<mañana>`. Agrupar por `cancha_id` en `lib/adaptadores.ts`.
- `/canchas`: `GET /canchas` y `GET /turnos?fecha=<fecha>` en paralelo; agrupar por cancha y filtrar las canchas no reservables. Evita N llamadas.
- `GET /turnos` ya devuelve `disponible`, por lo que no hace falta `GET /disponibilidad`.
- Alternativa descartada: `Promise.all` sobre `/disponibilidad` por cancha. Más llamadas y no trae turnos ocupados.

### Home autenticada
- `useSesion` usará el usuario guardado de inmediato y disparará `GET /auth/perfil` en segundo plano para refrescarlo. Sin usuario guardado, espera el perfil.
- `inicio-client` decide entre `Landing` y `HomeClient` según `useSesion({ redirigirSinSesion: false })`.
- La próxima reserva se calcula con `aReservasUI` + `obtenerProximaReserva`.
- Los accesos rápidos y los filtros usan `DisciplinaApi`; el conteo por disciplina se calcula con los turnos libres de la fecha mostrada.
- Las tarjetas de canchas usan nombre, disciplinas y próximo turno libre reales. No se muestran precios ni amenities.

### Errores y sesión
- `peticion` conservará la ruta actual en el parámetro `redirigir` al redirigir por `401`.
- Login leerá `redirigir`, validará que sea una ruta interna (helper `rutaRetornoSegura`) y navegará allí; si no, usará el destino por rol.
- Reservar distinguirá `409` (turno ocupado), `400` (turno pasado/inválido) y `401` (sesión vencida). Al éxito navegará a `/reservas?reserva=creada` y Mis reservas mostrará el aviso.
- Los errores de red siguen usando `mensajeDeError`; cada vista ofrece reintento.

### Estados de UI
- Skeleton con bloques `animate-pulse` en Home, `/canchas`, reservar y Mis reservas.
- Vacío con mensaje contextual: "No hay turnos cargados para esta fecha", "No tenés reservas próximas", etc.
- Error con `role="alert"` y botón "Reintentar" que incrementa un contador de intento.

### Elementos que se quitan
- Home autenticada: "Socio Activo #2841", ubicación, precios, superficies, amenities, QR, check-in, "actualizado en tiempo real", canchas y disciplinas fijas.
- Home pública: descripciones fijas por disciplina; se usan `reglas`/`duracionTipicaMinutos` de `GET /disciplinas`.
- Footer: dirección, teléfono, email, redes y horarios inventados.
- Navbar: notificaciones sin backend y enlaces `#`; se reemplazan por destinos reales.

### Documentación local
- Agregar `docker-compose.local.yml` como override que expone `db:5432` y `backend:3001` para poder correr el frontend con `npm run dev`.
- Documentar en `frontend/README.md`: variables, `docker compose ... up -d db backend`, migraciones/seed, usuarios de prueba y generación de turnos desde `/admin/turnos`.
- No se toca `docker-compose.yml` de producción.

## Risks / Trade-offs

- **Sesión en `localStorage`** → se mantiene el comportamiento actual; el cambio no introduce cookies.
- **Home hace varias llamadas** → disciplinas, reservas, canchas y turnos. Se ejecutan en paralelo y los turnos se piden una vez por fecha; no se hace una llamada por cancha.
- **Datos de seed sin turnos de hoy** → la Home mostrará mañana como fecha de respaldo; si tampoco hay, estado vacío. No se inventan turnos.
- **El backend puede no estar disponible en local** → los estados de error y reintento cubren el caso; el README explica cómo levantarlo.
- **Doble lockfile / raíz** → no se modifica en este change.
- **El login por rol puede perder el retorno** → se resuelve validando `redirigir` antes de navegar.

## Migration Plan

1. Mover la carpeta de canchas y crear los layouts público/protegido.
2. Actualizar helpers y tipos.
3. Conectar Home pública y autenticada.
4. Conectar `/canchas`, reservar y Mis reservas.
5. Actualizar README y override local.
6. Ejecutar `openspec validate --all --strict --no-interactive`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.
7. Rollback: revertir la rama `feature/front-conectar-api`; no hay migraciones de datos ni cambios de contrato.
