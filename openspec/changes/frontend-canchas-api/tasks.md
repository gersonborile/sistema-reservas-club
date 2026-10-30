## 1. Capa de API y adaptadores

- [ ] 1.1 Agregar `obtenerCanchas`, `obtenerCancha`, `obtenerDisciplinas` y `obtenerTurnos` (recorre las páginas de `GET /turnos`) sobre `peticion` de `lib/api.ts`, y los adaptadores `aCanchaUI` / `aFranjaUI` en `lib/adaptadores.ts` (`activa` derivada del estado, etiqueta de disciplina, franja con `id` de turno), y verificar con typecheck que compilan
- [ ] 1.2 Agregar el helper de fecha local `YYYY-MM-DD` en `lib/fechas.ts` si no existe y verificar que no usa `toISOString()`

## 2. Pantallas

- [ ] 2.1 Conectar `/canchas` (`canchas-client.tsx`) al listado real con filtro por `disciplina` y ocultar las canchas en mantenimiento, y verificar contra el backend local
- [ ] 2.2 Conectar las franjas de la cancha elegida a `GET /turnos` (libres seleccionables, ocupadas deshabilitadas, mensaje para fecha sin turnos) y verificar contra el backend local con turnos libres y ocupados
- [ ] 2.3 Conectar los accesos rápidos de la Home a `GET /disciplinas` y "Canchas disponibles ahora" a `GET /disponibilidad`, y verificar que "Reservar" lleva a la confirmación con el turno elegido
- [ ] 2.4 Agregar estados de carga, error con reintento y vacío en las pantallas conectadas, quitar la imagen de cancha y verificar con el backend apagado que se muestra "No se pudo conectar con el servidor."

## 3. Integración y verificación

- [ ] 3.1 Correr `typecheck`, `lint` y `build` del frontend y verificar que terminan sin errores
- [ ] 3.2 Con backend y Postgres locales (con turnos del seed), recorrer a mano Home → Canchas → filtro → franjas y verificar los escenarios de `specs/frontend-canchas-api/spec.md`
- [ ] 3.3 Tras el deploy, verificar en `https://matchpoint.alquilerespunilla.com.ar` que el listado de canchas carga datos reales
