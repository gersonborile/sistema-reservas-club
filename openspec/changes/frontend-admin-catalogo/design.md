## Context

`POST /canchas` recibe `{ nombre, ubicacion, capacidad, estado, disciplinaIds[] }`; `PUT /canchas/:id` actualiza (campos opcionales); `DELETE /canchas/:id` elimina. `POST /equipamiento` recibe `{ nombre, disciplinaId, stockTotal, precioUnitario, activo? }`; `PUT /equipamiento/:id` actualiza y responde `409` si `stockTotal` queda por debajo de lo alquilado. Ambos exigen `ADMINISTRADOR`. `GET /canchas` y `GET /equipamiento` son públicos; este último es paginado (`page`, `limit`).

## Goals / Non-Goals

**Goals:**
- Que el administrador cree y edite canchas y equipamiento reales y vea métricas reales.
- Mantener la UI actual: solo se agregan los campos que el backend exige.

**Non-Goals:**
- Eliminar canchas desde la UI (el panel no tiene esa acción; el `DELETE` queda sin conectar).
- Turnos y pagos (`frontend-admin-reservas`).
- Subir imágenes de canchas.

## Decisions

- **Ubicación y capacidad**: se agregan como campos obligatorios al formulario de nueva cancha y al de edición, con las mismas validaciones del backend (texto no vacío; entero mayor o igual a 1). Se prefiere esto a enviar valores inventados.
- **Disciplinas de la cancha**: el formulario usa un selector alimentado por `GET /disciplinas`; se envía el UUID en `disciplinaIds`. Una cancha puede tener varias, pero el formulario actual elige una; se mantiene una sola por simplicidad y se anota como límite.
- **Activar/desactivar**: `activa` se deriva de `estado !== EN_MANTENIMIENTO`; "Desactivar" envía `PUT { estado: "EN_MANTENIMIENTO" }` y "Activar" envía `PUT { estado: "DISPONIBLE" }`. No se usa `OCUPADA` desde el panel.
- **Stock**: la edición envía `stockTotal`; el `409` del backend se muestra tal cual ("no puede ser menor a lo alquilado") junto al campo. "Poco stock" conserva el umbral del front (`stockTotal <= 5`, `UMBRAL_POCO_STOCK`).
- **Nuevo equipamiento**: formulario con nombre, disciplina (selector), stock total y precio unitario (decimal no negativo). Los errores `400` se muestran por campo usando `campos` (de `frontend-base-api`).
- **Reservas de hoy**: `GET /reservas/mis` como administrador devuelve todas las reservas (no hay endpoint específico); el frontend filtra por la fecha local de hoy y `CONFIRMADA`. No se agrega endpoint nuevo mientras el volumen sea chico.
- **Permisos**: la ruta `/admin` ya exige rol `administrador` en el layout (`useSesion`); el backend responde `403` si un no administrador llama igual, y el frontend lo muestra como error genérico.
- **Refresco**: tras cada alta o edición exitosa se vuelve a pedir la lista afectada (sin actualización optimista), para reflejar lo que quedó en la base.

## Risks / Trade-offs

- [Cancha con una sola disciplina en la UI] El backend admite varias; editar una cancha con varias desde la UI podría perderlas → al editar se preservan las existentes y solo se agrega o cambia la elegida; se verifica con una cancha del seed con varias disciplinas si existe.
- [Métrica "Reservas de hoy" cargando todo] Si crece el volumen, traer todas las reservas es costoso → aceptable para el alcance; se anota como candidato a un `GET /reservas?fecha=` futuro.
- [Doble envío] Se deshabilitan los botones de guardar mientras la petición está en curso.
