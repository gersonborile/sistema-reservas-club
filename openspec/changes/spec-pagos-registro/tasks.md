## 1. Contrato de API y datos

- [ ] 1.1 Verificar que el modelo Prisma `Pago` existente (`reservaId` unique, `monto` Decimal(10,2), `metodoPago`, `estado` default `PENDIENTE`, `fechaPago` nullable) alcanza sin migración nueva y que `prisma generate` corre sin errores
- [ ] 1.2 Definir `CrearPagoDto` (`monto` con `Min(0.01)`, `metodoPago` por enum) y verificar con unit tests que rechaza payloads inválidos
- [ ] 1.3 Documentar en OpenAPI `POST /api/v1/reservas/:id/pagos`, `GET /api/v1/reservas/:id/pagos`, `PATCH /api/v1/pagos/:id/pagar` y `PATCH /api/v1/pagos/:id/anular` (códigos 200/201/400/401/403/404/409, estados y montos) y verificar que coincide con los escenarios de `specs/payments/spec.md`

## 2. Implementación backend

- [ ] 2.1 Crear `PagosModule` siguiendo el patrón del repo (controller + service con Prisma, como `reservas`) y verificar que compila y se registra en `AppModule`
- [ ] 2.2 Implementar `POST /reservas/:id/pagos` transaccional: reserva inexistente → 404, reserva `CANCELADA` → 409, pago existente (unique `P2002`) → 409, estado inicial `PENDIENTE`, respuesta 201; verificar con test e2e
- [ ] 2.3 Implementar `PATCH /pagos/:id/pagar` (`PENDIENTE` → `PAGADO`, setea `fechaPago`; inexistente → 404, no `PENDIENTE` → 409) y `PATCH /pagos/:id/anular` (`PENDIENTE`/`PAGADO` → `ANULADO`, ya `ANULADO` → 409) y verificar con tests e2e las transiciones de estado
- [ ] 2.4 Implementar `GET /reservas/:id/pagos` (reserva inexistente o sin pago → 404, con pago → 200 incluyendo `monto`, `metodoPago`, `estado`, `fechaPago`) y verificar con test e2e
- [ ] 2.5 Aplicar permisos: mutaciones solo `ADMINISTRADOR` (`USUARIO` → 403), consulta con `USUARIO` solo sobre su reserva (ajena → 403), `ADMINISTRADOR` sobre cualquier reserva, 401 sin token; verificar con tests de roles

## 3. Unit tests de service

- [ ] 3.1 Cubrir en `PagosService` las transiciones de estado (incluidos los `409`), una-reserva-un-pago (`P2002` → `409`), montos y permisos por titularidad, verificando que los tests de Jest pasan

## 4. Frontend

- [ ] 4.1 Implementar la pantalla de cobros para `ADMINISTRADOR` (registrar el pago de una reserva, confirmar cobro y anular) y verificar contra el backend en local
- [ ] 4.2 Mostrar el estado de pago de sus reservas al `USUARIO` en "mis reservas" y ocultar las acciones de confirmar/anular para roles no administradores; verificar los datos reales contra `GET /reservas/mis`
- [ ] 4.3 Mostrar/ocultar las acciones según rol y titularidad y verificar que un `USUARIO` no ve acciones de registro sobre reservas ajenas

## 5. Integración y verificación

- [ ] 5.1 Correr `npm run test` (unit) y los tests e2e del flujo completo reserva → pago → confirmación → anulación y verificar que toda la suite pasa y se mantiene el invariante de un pago por reserva
- [ ] 5.2 Revisar los escenarios de `specs/payments/spec.md` contra el API desplegado en local y confirmar códigos, estados, montos e invariantes de pago