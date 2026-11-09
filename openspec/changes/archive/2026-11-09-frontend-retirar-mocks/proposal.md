## Why

Cuando los cuatro changes anteriores conecten todas las pantallas al backend, `lib/mock-reservas.ts` queda sin uso, pero seguiría en el repositorio y en los navegadores de los usuarios: sus claves de `localStorage` (`clubDeportivo.reservas`, `clubDeportivo.canchas`, `clubDeportivo.equipamiento`, `clubDeportivo.usuariosMock`) conservan datos simulados, y la última incluye contraseñas en texto plano del login simulado anterior. Este change cierra la serie: retira el mock, mueve los tipos que sigan siendo necesarios y limpia los datos viejos.

## What Changes

- Se elimina `frontend/lib/mock-reservas.ts` y cualquier importación suya; los tipos de UI que se sigan usando viven en `lib/tipos.ts` o en los adaptadores.
- Limpieza única de datos heredados: al iniciar la aplicación se borran de `localStorage` las claves del mock (`clubDeportivo.reservas`, `clubDeportivo.canchas`, `clubDeportivo.equipamiento`, `clubDeportivo.usuariosMock`).
- Se eliminan comentarios y constantes del mock en `lib/api.ts` y `lib/sesion.ts` que hayan quedado obsoletos.
- Se actualiza `frontend/README.md`: el frontend ya no usa datos simulados y requiere el backend.
- Verificación final de que ninguna pantalla depende de datos simulados.

## Capabilities

### New Capabilities
- `frontend-sin-mocks`: el frontend no contiene ni conserva datos simulados y depende solo del backend.

### Modified Capabilities
- Ninguna.

## Impact

- **Frontend**: borrado de `lib/mock-reservas.ts`; ajustes menores de imports, `lib/tipos.ts`, `README.md` y un módulo de limpieza de claves heredadas.
- **Backend / Infra**: sin cambios.
- **Rollback**: revertir el PR restaura el archivo del mock; los datos de `localStorage` ya borrados no se recuperan (eran simulados).

## Dependencies

- Requiere que `frontend-canchas-api`, `frontend-reservas-api`, `frontend-admin-catalogo` y `frontend-admin-reservas` estén en la rama base; si alguno no se mergea, este change no debe mergearse.
