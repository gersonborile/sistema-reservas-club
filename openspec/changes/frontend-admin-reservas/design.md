## Context

`GET /turnos?cancha_id=&disciplina_id=&fecha=&page=&limit=` es público y paginado. `POST /turnos` recibe `{ cancha_id, disciplina_id, fecha (YYYY-MM-DD), hora_inicio, hora_fin (HH:mm) }`; responde `400` (rango inválido o fecha pasada) o `409` (solapamiento). `DELETE /turnos/:id` responde `204`, o `409` si el turno tiene una reserva activa. Los pagos: `POST /reservas/:id/pagos { monto, metodoPago }` (`EFECTIVO` / `TRANSFERENCIA` / `TARJETA`), `GET /reservas/:id/pagos`, `PATCH /pagos/:id/pagar` y `PATCH /pagos/:id/anular`; estados `PENDIENTE` / `PAGADO` / `ANULADO`; una reserva tiene a lo sumo un pago, y solo se cobra una reserva confirmada.

## Goals / Non-Goals

**Goals:**
- Que el administrador pueda abrir turnos para que los socios reserven.
- Que pueda ver las reservas y registrar y cobrar su pago.

**Non-Goals:**
- Generar turnos en masa o con plantillas semanales (se crean de a uno).
- Reservar a nombre de un socio desde el panel.
- Reportes o exportaciones de pagos.

## Decisions

- **Turnos: una vista por cancha y fecha.** Selector de cancha y de fecha (por defecto, hoy); la tabla lista los turnos con hora de inicio y fin, estado (libre / ocupado) y acciones. Crear y editar usan un formulario con hora de inicio y fin; la disciplina se elige entre las de la cancha.
- **Errores del backend visibles**: `400`, `409` y `404` muestran el mensaje del backend en el formulario (no se replican las reglas en el cliente más allá de campos obligatorios y formato `HH:mm`).
- **Eliminar turno**: requiere confirmación en pantalla; si el backend responde `409` (reserva activa) el turno permanece y se explica el motivo.
- **Reservas del administrador**: `GET /reservas/mis` devuelve todas; la tabla se ordena por fecha y hora y permite filtrar por estado. Si el backend no devuelve el nombre del usuario, se muestra su `usuarioId` abreviado y se registra como limitación.
- **Pago por reserva**: al abrir el detalle de una reserva se pide `GET /reservas/:id/pagos`. Sin pago: formulario de monto y método (solo si la reserva está `CONFIRMADA`). Con pago `PENDIENTE`: acciones "Confirmar cobro" y "Anular". `PAGADO`: acción "Anular". `ANULADO`: solo lectura. Un pago anulado no permite registrar otro (el backend responde `409` por pago ya existente); la UI lo informa.
- **Cancelar como administrador**: usa el mismo `PATCH /reservas/:id/cancelar`; el backend permite al administrador cancelar cualquier reserva.
- **Monto sugerido**: si la reserva tiene alquiler, el formulario de pago propone el `total` del alquiler como monto inicial editable; no se calcula ningún precio de cancha.
- **Refresco**: tras cada acción exitosa se vuelve a pedir lo afectado, sin actualización optimista.

## Risks / Trade-offs

- [Reservas sin nombre de usuario] El contrato actual de la reserva no incluye datos del usuario → se muestra el `usuarioId` abreviado y se anota; ampliar el contrato queda fuera de este change.
- [Alcance amplio] Son dos pantallas nuevas → las tareas se separan por pantalla para poder mergear una sin la otra si hace falta.
- [Cancelar una reserva con pago] El backend decide si corresponde anular el pago; la UI muestra el estado resultante y no asume una anulación automática.
