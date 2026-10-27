## 1. Contrato de API y datos

- [x] 1.1 Agregar el modelo Prisma `Alquiler` y re-relacionar `ReservaEquipamiento` como indica `design.md` (reutilizando la tabla `reserva_equipamientos` como items); generar la migración `alquileres` con `prisma migrate dev`, añadir el backfill del design antes de la FK nueva, adaptar `prisma/seed.ts` y verificar que `prisma migrate dev`, `prisma generate` y `npm run build` corren sin errores
- [x] 1.2 Definir `CrearAlquilerDto` / `ItemAlquilerDto` (`items` no vacío, sin repetir `equipamientoId`, `cantidad` entero >= 1) y verificar con unit tests que rechaza payloads inválidos
- [x] 1.3 Documentar en OpenAPI `POST /api/v1/reservas/:id/alquiler` (códigos 201/400/401/403/404/409, montos) con `@ApiTags/@ApiResponse` y verificar que coincide con los escenarios de `specs/rentals/spec.md`

## 2. Implementación backend

- [x] 2.1 Corregir `PrismaService.transaccion` para que use el `tx` real de `$transaction` (ver `design.md`) y verificar que toda la suite sigue pasando
- [x] 2.2 Crear `AlquileresModule` (controller + service con Prisma, como `pagos`) con `mensajes.ts` y `alquiler-publico.ts`, y verificar que compila y se registra en `AppModule`
- [x] 2.3 Implementar `POST /reservas/:id/alquiler` transaccional: id no UUID o reserva inexistente → 404, reserva ajena siendo `USUARIO` → 403, reserva `CANCELADA` → 409, equipamiento inexistente → 404, equipamiento inactivo → 409, descuento atómico (`updateMany` con `stockDisponible >= cantidad`, 0 filas → 409 con rollback), alquiler existente (`P2002`) → 409, éxito → 201; verificar con tests e2e
- [x] 2.4 Implementar montos: leer `precioUnitario` del catálogo, persistir el snapshot en `ReservaEquipamiento`, calcular `total` por item y `Alquiler.total` con `Prisma.Decimal`; verificar con test e2e que los montos quedan congelados al cambiar el catálogo
- [x] 2.5 Completar el punto de extensión de `ReservasService.cancelar`: restituir en la misma transacción el `stockDisponible` de los items del alquiler con tope en `stockTotal` (`UPDATE ... LEAST(...)`), sin tocar stock si no hay alquiler ni si la reserva ya estaba cancelada; verificar con tests unit y e2e que el stock vuelve
- [x] 2.6 Incluir el `alquiler` (o `null`) en `GET /reservas/mis` (`SELECCION_RESERVA_PUBLICA` y `aReservaPublica`) y verificar con test e2e
- [x] 2.7 Verificar permisos con tests de roles: `USUARIO` solo sobre su reserva (403 si es ajena), `ADMINISTRADOR` sobre cualquiera, 401 sin token

## 3. Unit tests de service

- [x] 3.1 Cubrir en `AlquileresService` (Prisma mockeado) montos (`precioUnitario × cantidad`, total del alquiler sin error de punto flotante), descuento de stock, un-alquiler-por-reserva (`P2002` → 409), equipamiento inactivo y permisos por titularidad, y en `ReservasService.cancelar` la restitución de stock, verificando que `npm run test` pasa

## 4. Frontend (después del backend, al conectar front y back)

- [ ] 4.1 Implementar el flujo de alquiler sobre una reserva existente (seleccionar equipamiento del catálogo con precio, cantidades y total) y verificar contra el backend en local
- [ ] 4.2 Mostrar el alquiler y sus montos en "mis reservas" y verificar los datos reales contra `GET /reservas/mis`
- [ ] 4.3 Mostrar/ocultar la acción "alquilar" según rol y titularidad y verificar que un `USUARIO` no la ve sobre reservas ajenas

## 5. Integración y verificación

- [x] 5.1 Correr `npm run test` (unit) y `npm run test:e2e` y verificar que toda la suite pasa, incluidos los e2e existentes de reservas, pagos y equipamiento
- [ ] 5.2 Revisar los escenarios de `specs/rentals/spec.md` y `specs/reservations/spec.md` contra el API levantado en local (Postgres real) y confirmar códigos, montos y que el stock queda consistente tras alquilar y cancelar
