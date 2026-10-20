## 1. Contrato y DTOs

- [ ] 1.1 Crear `CrearReservaDto` (`turnoId` UUID, `usuarioId?` UUID) y `ListarReservasQueryDto` (`usuarioId?` UUID) con `class-validator` y verificar con unit tests que rechazan payloads inválidos (400)
- [ ] 1.2 Agregar el helper de instante de inicio del turno (`fecha` + `horaInicio` en UTC) junto a los de `turnos/horarios.ts` y verificar con unit tests que calcula bien turnos de medianoche y distintos husos
## 2. Implementación backend

- [ ] 2.1 Crear `ReservasModule` (controller + service + DTOs, mensajes en `mensajes.ts`) siguiendo el patrón de `turnos` y verificar que compila y se registra en `AppModule`
- [ ] 2.2 Implementar `POST /reservas` en una `$transaction`: turno inexistente → 404, turno pasado → 400, cancha no `DISPONIBLE` → 409, `updateMany` condicional sobre `Turno.disponible` (0 filas → 409), crear la reserva `CONFIRMADA`; verificar con tests e2e (201, 400, 404, 409 turno ocupado, 409 cancha en mantenimiento, 401) y que el turno queda `disponible = false`
- [ ] 2.3 Resolver titularidad en `POST`: `USUARIO` con `usuarioId` ajeno → 403, `ADMINISTRADOR` con `usuarioId` existente → 201 a nombre de ese usuario, `usuarioId` inexistente → 404; verificar con tests e2e
- [ ] 2.4 Implementar `GET /reservas/mis` con titularidad: `USUARIO` ve solo las suyas (cualquier estado, con el turno embebido), `ADMINISTRADOR` ve todas con `?usuarioId=` opcional, `USUARIO` con `usuarioId` ajeno → 403; verificar con tests e2e (200, 403, 401)
- [ ] 2.5 Implementar `PATCH /reservas/:id/cancelar`: reserva inexistente → 404, ajena siendo `USUARIO` → 403, ventana menor a 2 h o turno iniciado → 409, ya cancelada → 409, éxito → 200 con la reserva `CANCELADA` y el turno `disponible = true` en la misma transacción; verificar con tests e2e
- [ ] 2.6 Dejar en el service de cancelación un punto de extensión para restituir el stock del alquiler (lo implementa `spec-alquiler`) y verificar que cancelar sin alquiler no toca stock

## 3. Unit tests de service

- [ ] 3.1 Cubrir en `ReservasService` (Prisma mockeado) la carrera por el turno, el turno pasado, la ventana de 2 h en el borde exacto, los permisos por titularidad y la reversión de la transacción cuando falla un paso, verificando que Jest pasa

## 4. Integración y verificación

- [ ] 4.1 Correr `npm run test` (unit) y los tests e2e de reservas y verificar que toda la suite pasa, incluidos los e2e existentes de `turnos`
- [ ] 4.2 Revisar cada escenario de `specs/reservations/spec.md` contra la API local y confirmar códigos de respuesta, estados de la reserva y el valor de `Turno.disponible` antes y después de reservar y cancelar
