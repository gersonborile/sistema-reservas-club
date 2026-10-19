## 1. Modelo de datos del Turno

- [x] 1.1 Agregar al `schema.prisma` el modelo `Turno` (id UUID, `cancha_id` FK a `Cancha`, `disciplina_id` FK a `Disciplina`, `fecha` DATE, `hora_inicio`, `hora_fin`, `disponible` default `true`) y verificar que `prisma generate` compila el schema
- [x] 1.2 Aplicar la migración (`prisma migrate dev --name turnos`) y verificar que la tabla `Turno` con sus FKs a `Cancha` y `Disciplina` existe en la BD
- [x] 1.3 Crear el helper de horarios del módulo (manejo de `hora_inicio`/`hora_fin` como hora/minuto, normalización al persistir y al responder) y verificar con un unit test que un turno a medianoche se persiste/lee con la fecha del día correcto
- [x] 1.4 Centralizar la función de superposición de rangos `[inicio, fin)` y verificar con unit tests que detecta solapamientos parciales, totales y contiguos (sin solape)

## 2. Consulta de turnos

- [x] 2.1 Crear el módulo `Turnos` (controller + servicio + DTOs) en `backend/src/turnos` y verificar que se registra en `AppModule` y el health check sigue en `/`
- [x] 2.2 Implementar `GET /turnos` con filtros opcionales `cancha_id`, `disciplina_id`, `fecha` y paginación `page`/`limit`, y verificar con tests de integración que los filtros y la paginación devuelven el subconjunto esperado y que cada turno incluye `disponible`
- [x] 2.3 Implementar `GET /turnos/:id` y verificar que responde 200 con el turno (cancha, disciplina y `disponible`) para un id existente y 404 para un id inexistente

## 3. Disponibilidad

- [x] 3.1 Implementar `GET /disponibilidad?cancha_id=&fecha=` que retorne solo turnos con `disponible = true` de esa cancha y fecha, y verificar con tests e2e que una lista vacía responde 200 con `[]`
- [x] 3.2 Verificar que `GET /disponibilidad` sin `cancha_id` o `fecha` responde 400, y que con `cancha_id` inexistente responde 404

## 4. Mutaciones de turnos (admin)

- [x] 4.1 Crear `CrearTurnoDto` y `ActualizarTurnoDto` (parcial) con `class-validator` (UUID de referencias, `fecha` ISO, horas válidas) y verificar que el `ValidationPipe` rechaza payloads inválidos con 400
- [x] 4.2 Implementar `POST /turnos` en el servicio (validar existencia de cancha/disciplina → 422, `hora_fin` > `hora_inicio` y fecha no pasada → 400, superposición con turnos existentes → 409) y verificar cada caso con tests e2e
- [x] 4.3 Implementar `PATCH /turnos/:id` (mismas validaciones excluyendo el propio turno de la comparación de superposición; 404 si no existe) y verificar con tests e2e
- [x] 4.4 Implementar `DELETE /turnos/:id` (204 si `disponible = true`, 404 si no existe, 409 si `disponible = false` por reserva activa) y verificar con tests e2e

## 5. Autorización admin-only

- [ ] 5.1 Montar `@Roles('admin')` + `AuthzGuard` (mismo seam `AuthPrincipalProvider` que canchas) sobre `POST/PATCH/DELETE /turnos` y verificar que el guard aplica en esas rutas
- [ ] 5.2 Verificar con tests e2e que las mutaciones sin principal → 401 y con rol distinto a `admin` → 403, y que `GET /turnos*` y `GET /disponibilidad` siguen accesibles sin autenticación

## 6. Calidad y cierre

- [ ] 6.1 Correr el suite completo (`npm run lint`, `npm run test:e2e`) y verificar que pasa en verde
- [ ] 6.2 Revisar que los tests e2e cubren cada escenario del spec `specs/turnos-franjas/spec.md` y agregar los faltantes (verificar cobertura escenario a escenario)