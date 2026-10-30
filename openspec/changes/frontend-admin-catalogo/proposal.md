## Why

El panel de administración (Resumen, Canchas y Equipamiento) opera sobre `localStorage`. Este change lo conecta con el backend real: el CRUD de canchas (`/canchas`), el stock y alta de equipamiento (`/equipamiento`) y las métricas del Resumen.

Desajustes entre el mock y el backend:
- **Crear cancha**: el formulario del panel pide solo nombre y disciplina; el backend exige además `ubicacion`, `capacidad`, `estado` y `disciplinaIds` (UUID de `GET /disciplinas`).
- **Activar/desactivar**: el mock tiene `activa`; el backend no, y modela el mantenimiento con `estado = EN_MANTENIMIENTO`.
- **Equipamiento**: el panel solo edita el stock; el backend maneja `stockTotal`, `stockDisponible`, `precioUnitario`, `activo`, y rechaza bajar el stock total por debajo de lo ya alquilado.
- **Solo administrador**: `POST`/`PUT`/`DELETE` de canchas y equipamiento exigen rol `ADMINISTRADOR`.

## What Changes

- Funciones de API de administración: `crearCancha`, `editarCancha`, `cambiarEstadoCancha`, `crearEquipamiento` y `editarEquipamiento`, con adaptadores.
- Panel de canchas: crear y editar con los campos reales (se agregan **Ubicación** y **Capacidad** al formulario; las disciplinas salen de `GET /disciplinas`); "Desactivar"/"Activar" cambia el estado entre `EN_MANTENIMIENTO` y `DISPONIBLE`.
- Panel de equipamiento: "Editar stock" envía `PUT /equipamiento/:id` con `stockTotal` y muestra el `409` del backend si el valor queda por debajo de lo alquilado; "+ Nuevo" crea un equipamiento (nombre, disciplina, stock total, precio unitario).
- Resumen: "Canchas activas" y "Equipamiento con poco stock" se calculan desde `GET /canchas` y `GET /equipamiento`; "Reservas de hoy" desde `GET /reservas/mis` (el administrador recibe todas) filtrando la fecha de hoy y estado `CONFIRMADA`.
- Estados de carga y error en el panel.

## Capabilities

### New Capabilities
- `frontend-admin-catalogo`: administración de canchas y equipamiento y métricas del Resumen contra el backend real.

### Modified Capabilities
- Ninguna. La spec `frontend-panel-admin` sigue vigente en lo funcional; este change agrega los campos que el backend exige y cambia el origen de los datos.

## Impact

- **Frontend**: `app/admin/panel-client.tsx`, `tarjeta-canchas.tsx`, `tarjeta-equipamiento.tsx`, `tarjeta-reservas-hoy.tsx`, `lib/api*.ts` y adaptadores.
- **Backend**: sin cambios.
- **Rollback**: revertir el PR; el panel vuelve al mock.

## Dependencies

- Requiere `frontend-base-api` (sesión y roles), `frontend-canchas-api` (adaptador de canchas y disciplinas) y `frontend-reservas-api` (adaptador de reservas, para "Reservas de hoy").
