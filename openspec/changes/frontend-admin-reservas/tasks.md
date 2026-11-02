## 1. Capa de API

- [ ] 1.1 Agregar `crearTurno`, `editarTurno`, `eliminarTurno`, `obtenerPago`, `registrarPago`, `confirmarPago` y `anularPago` sobre `peticion` (con adaptadores) y verificar con typecheck que compilan

## 2. Turnos y franjas

- [ ] 2.1 Habilitar el ítem "Turnos y franjas" y crear `app/admin/turnos` con selector de cancha y fecha y la lista de turnos (`GET /turnos`, estado libre/ocupado, mensaje para fecha sin turnos), y verificar contra el backend local
- [ ] 2.2 Implementar crear y editar turno (disciplina de la cancha, fecha, hora de inicio y fin) mostrando los `400`/`409` del backend, y verificar con solapamiento, rango inválido y fecha pasada
- [ ] 2.3 Implementar eliminar turno con confirmación y verificar el `409` de un turno con reserva activa

## 3. Reservas y pagos

- [ ] 3.1 Habilitar el ítem "Reservas" y crear `app/admin/reservas` con la lista completa (`GET /reservas/mis` como administrador), orden, filtro por estado y cancelar, y verificar que aparecen reservas de varios socios
- [ ] 3.2 Implementar la gestión del pago en el detalle de la reserva (registrar con monto sugerido por el alquiler, confirmar cobro, anular, solo lectura si está anulado) y verificar cada escenario contra el backend local
- [ ] 3.3 Restringir ambas pantallas al rol `administrador` y mostrar el error de permisos ante `403`, y verificar que un socio es redirigido a la Home

## 4. Integración y verificación

- [ ] 4.1 Correr `typecheck`, `lint` y `build` del frontend y verificar que terminan sin errores
- [ ] 4.2 Con backend y Postgres locales, recorrer a mano: crear turnos como administrador, reservarlos como socio, cobrar el pago y cancelar, y verificar los escenarios de `specs/frontend-admin-reservas/spec.md`
- [ ] 4.3 Tras el deploy, verificar en `https://matchpoint.alquilerespunilla.com.ar` que el administrador puede crear un turno y que un socio lo reserva
