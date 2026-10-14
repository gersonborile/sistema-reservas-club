## Context

Ver proposal.md. La pantalla vive dentro del layout protegido (`app/(protegido)/`), así que
hereda el guard de sesión y la navbar. Consume la capa mock `lib/mock-reservas.ts`, que
persiste las reservas en `localStorage`. Wireframe: `docs/wireframes/mis-reservas-web.png`.

## Goals / Non-Goals

**Goals:**
- Listar las reservas del usuario con sesión, con pestañas por estado.
- Cancelar una reserva propia respetando la regla de las 2 horas.
- Mantener coherencia visual con Canchas, Confirmar reserva y Home.

**Non-Goals:**
- Pantalla de detalle de reserva: "Ver detalle" sigue como placeholder.
- Cancelar desde la Home: "Cancelar" de la tarjeta "Próxima reserva" sigue como placeholder.
- Modificar o reprogramar una reserva.
- Pago y reintegros.
- Backend real: se usa el mock.

## Decisions

1. **Ruta `/reservas`** dentro de `app/(protegido)/`. El link "Mis reservas" de la navbar
   apunta a ella y se subraya cuando la ruta empieza con `/reservas`.
2. **Mock.** Se agregan `obtenerReservasDeUsuario(usuarioId)` (ordenadas por fecha y hora
   ascendente) y `cancelarReserva(id, usuarioId)`. Esta última devuelve la reserva
   actualizada y lanza un error si la reserva no existe, no es del usuario, ya está
   cancelada o faltan menos de 2 horas para el turno.
3. **Liberar franja y equipamiento.** Cancelar solo cambia `estado` a `"cancelada"`. La
   disponibilidad de franjas y la de equipamiento ya ignoran las reservas que no están
   confirmadas, así que no hace falta otro cambio.
4. **Regla de las 2 horas** en una única función reutilizable en `lib/` (por ejemplo
   `puedeCancelar(reserva, ahora)`): una reserva se puede cancelar si su estado es
   `confirmada` o `pendiente` y el inicio del turno (fecha y hora locales) está a 2 horas o
   más de `ahora`. La UI usa esta función para deshabilitar el botón y `cancelarReserva`
   para validar.
5. **Pestañas** Todas, Confirmadas y Canceladas como estado local de la página. "Confirmadas"
   incluye también las reservas `pendiente`, porque el wireframe no distingue ese estado.
6. **Insignia de estado:** "Confirmada" con borde oscuro, "Cancelada" con borde y texto
   grises. Las `pendiente` se muestran como "Confirmada".
7. **Fechas** con `lib/fechas.ts`, sin depender del locale: "Mié 07/10 · 18:00 a 19:00"
   (día abreviado, fecha corta, rango de una hora).
8. **Estado vacío:** si no hay reservas en la pestaña activa, la tabla se reemplaza por un
   mensaje con un botón "Reservar una cancha".

## Risks / Trade-offs

- [Riesgo] La hora del turno se interpreta con la hora local del navegador →
  Mitigación: coincide con el criterio ya usado en `obtenerDisponiblesAhora`.
- [Riesgo] Cancelar es irreversible y se hace con un click → Mitigación: el botón
  "Cancelar" pide confirmación en línea (ver Estructura visual) antes de aplicar el cambio.
- [Riesgo] Al cambiar al backend real, la regla de las 2 horas se valida en el servidor →
  Mitigación: la UI solo la usa para deshabilitar el botón; la validación autoritativa
  queda en `cancelarReserva`.

## Estructura visual (`/reservas`)

- Fondo de página gris claro, como el resto de las pantallas protegidas.
- Encabezado: título "Mis reservas" a la izquierda y botón primario oscuro "+ Nueva
  reserva" a la derecha, que navega a `/canchas`.
- Pestañas bajo el encabezado: "Todas", "Confirmadas", "Canceladas", con una línea
  divisoria a todo el ancho; la pestaña activa va en negrita, texto oscuro y subrayada.
- Tarjeta blanca con borde fino que contiene la tabla. Encabezado de columnas en mayúsculas,
  texto chico y gris: CANCHA, FECHA Y HORARIO, EQUIPAMIENTO, ESTADO y ACCIONES (alineado a
  la derecha).
- Una fila por reserva, separadas por una línea fina:
  - Cancha: cuadrado gris como imagen a la izquierda; nombre en negrita y debajo la
    disciplina en gris chico.
  - Fecha y horario: "Mié 07/10 · 18:00 a 19:00".
  - Equipamiento: "2 paletas" o "2 paletas, 1 tubo de pelotas"; sin equipamiento, "Sin
    equipamiento" en gris claro.
  - Estado: insignia rectangular con borde.
  - Acciones a la derecha: "Ver detalle" (secundario, placeholder) y "Cancelar"
    (secundario). "Cancelar" va deshabilitado y en gris claro si la reserva está cancelada
    o faltan menos de 2 horas.
- Al hacer click en "Cancelar" la fila reemplaza los botones por "¿Cancelar esta reserva?"
  con "Sí, cancelar" y "No"; al confirmar, la reserva pasa a Cancelada.
- Nota al pie, con ícono de información, texto chico y gris: "Se puede cancelar hasta 2
  horas antes del turno. El equipamiento reservado vuelve al stock al cancelar."

## Open Questions

- "Ver detalle" queda como placeholder hasta definir si habrá pantalla de detalle.
