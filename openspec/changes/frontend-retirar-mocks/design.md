## Context

Tras `frontend-base-api` ya no hay login simulado, pero `mock-reservas.ts` sigue siendo el origen de canchas, equipamiento y reservas hasta que se conecten los demás changes. Al terminar la serie, ningún componente debería importarlo.

## Goals / Non-Goals

**Goals:**
- Dejar el repositorio sin código ni datos simulados.
- Borrar los datos heredados del navegador, en especial los que contienen contraseñas en texto plano.

**Non-Goals:**
- Cambiar funcionalidad visible.
- Migrar datos del mock al backend (eran de prueba).

## Decisions

- **Orden**: este change se implementa al final de la cadena. Antes de borrar el archivo se verifica con búsqueda en el código que no queda ningún `import` de `mock-reservas`; si queda alguno, se corrige en el change que corresponda, no acá.
- **Tipos que sobreviven**: lo que las pantallas aún usen (`Disciplina`, `Cancha`, `Franja`, `Reserva`, `Equipamiento`) ya vive en los adaptadores de los changes anteriores; si algún tipo sigue importándose del mock, se traslada a `lib/tipos.ts`.
- **Limpieza de claves heredadas**: una función `limpiarDatosHeredados()` en `lib/almacen-sesion.ts` borra las cuatro claves del mock. Se ejecuta una vez por carga de la aplicación, en el layout raíz y dentro de `try/catch` (el almacenamiento puede no estar disponible). Es idempotente: si las claves no existen, no hace nada. No toca `clubDeportivo.token`, `clubDeportivo.usuario` ni `theme`.
- **Sin migración de datos**: no se intenta preservar las reservas simuladas; no existen en el backend y no tienen valor.
- **README**: se reemplaza la nota sobre datos simulados por los requisitos para correr el frontend (backend y `NEXT_PUBLIC_API_URL`).

## Risks / Trade-offs

- [Importación olvidada] Borrar el archivo con una referencia viva rompe el build → el build y el typecheck lo detectan; se verifican antes del PR.
- [Borrado de datos del usuario] La limpieza elimina datos locales → son simulados y esta es la intención; se informa en el PR.
- [Sesión activa] La limpieza no toca token ni usuario, así que nadie pierde la sesión por este change.
