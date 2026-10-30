## Context

El backend expone públicamente (sin token): `GET /canchas?disciplina=&estado=`, `GET /canchas/:id`, `GET /disciplinas`, `GET /turnos?cancha_id=&disciplina_id=&fecha=&page=&limit=` y `GET /disponibilidad?cancha_id=&fecha=`. Los turnos usan nombres en `snake_case` (`cancha_id`, `hora_inicio`, `hora_fin`) y las canchas en `camelCase`. `/turnos` es paginado; `/disponibilidad` devuelve solo `disponible: true`.

## Goals / Non-Goals

**Goals:**
- Que listado, franjas y "disponibles ahora" muestren datos reales.
- Aislar el contrato del backend en adaptadores para que los componentes cambien poco.

**Non-Goals:**
- Reservar (lo hace `frontend-reservas-api`), CRUD de canchas (admin) y alquiler.
- Imágenes de canchas.

## Decisions

- **Adaptadores en un solo módulo** (`lib/adaptadores.ts`): `aCanchaUI(cancha)` y `aFranjaUI(turno)`. Los componentes dejan de importar tipos de `mock-reservas.ts` y usan los tipos del adaptador.
- **`activa`**: se deriva de `estado !== "EN_MANTENIMIENTO"`. Una cancha `OCUPADA` sigue siendo reservable en otros turnos, así que cuenta como activa. En el listado de socios solo se muestran las activas.
- **Disciplinas como datos**: se eliminan los literales `"Tenis" | "Fútbol 5" | "Pádel"`. La etiqueta visible es `nombre` con la primera letra en mayúscula (`futbol` → `Futbol`); no se inventa un mapa de etiquetas. El filtro de `/canchas` envía `disciplina=<nombre>` (el backend compara sin distinguir mayúsculas). Los accesos rápidos de la Home se generan con `GET /disciplinas`.
- **Franjas con `GET /turnos`**: para pintar libres y ocupadas se piden todos los turnos de la cancha en la fecha (`limit` alto y recorrido de páginas hasta agotar) y `disponible` decide el estado. La franja guarda el `id` del turno, que `frontend-reservas-api` necesita para reservar. Se muestra `hora_inicio` (`HH:MM`).
- **Disponibles ahora**: `GET /canchas?estado=DISPONIBLE` y, por cada una, `GET /disponibilidad?cancha_id&fecha=<hoy local>`; se toma el primer turno cuyo `hora_fin` es posterior a la hora actual. Son N+1 peticiones, aceptable con pocas canchas; se hacen en paralelo (`Promise.all`).
- **Fecha local**: `fecha` se arma con la fecha local del usuario (`lib/fechas.ts`), no con `toISOString()` (UTC), para no desfasar el día.
- **Carga y errores**: cada pantalla maneja `cargando`, `error` (con mensaje y reintento) y `vacío`. Un `ApiError` de red muestra "No se pudo conectar con el servidor.".

## Risks / Trade-offs

- [Base sin turnos] La pantalla de franjas queda vacía → mensaje "No hay turnos para esta fecha."; la carga de turnos la resuelve el administrador (`frontend-admin-reservas`) o el seed.
- [Paginación de `/turnos`] Si el límite máximo del backend es bajo, hay que recorrer páginas → se implementa el recorrido y se verifica con más turnos que el límite.
- [Etiquetas sin acentos] `Futbol` sin tilde viene del dato; se corrige cargando el nombre correcto en la base, no en el front.
