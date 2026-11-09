## Purpose

Garantiza que el frontend no contiene ni conserva datos simulados y que depende solo del backend real.

## ADDED Requirements

### Requirement: Sin código de datos simulados
El frontend SHALL NOT contener `lib/mock-reservas.ts` ni importaciones de ese módulo, y ninguna pantalla SHALL leer ni escribir datos de dominio (canchas, equipamiento, reservas, usuarios) en `localStorage`.

#### Scenario: Búsqueda de referencias
- **WHEN** se busca `mock-reservas` en el código fuente del frontend
- **THEN** no hay ninguna coincidencia

#### Scenario: Build sin el mock
- **WHEN** se ejecutan `typecheck` y `build` del frontend
- **THEN** terminan sin errores

### Requirement: Limpieza de datos heredados
Al cargar la aplicación, el frontend SHALL borrar de `localStorage` las claves `clubDeportivo.reservas`, `clubDeportivo.canchas`, `clubDeportivo.equipamiento` y `clubDeportivo.usuariosMock`, SHALL NOT modificar `clubDeportivo.token`, `clubDeportivo.usuario` ni `theme`, y SHALL tolerar que el almacenamiento no esté disponible.

#### Scenario: Navegador con datos del mock
- **WHEN** un navegador conserva las cuatro claves del mock y se carga la aplicación
- **THEN** las cuatro claves quedan borradas

#### Scenario: Sesión intacta
- **WHEN** el usuario tiene sesión iniciada y se ejecuta la limpieza
- **THEN** el token y el usuario guardados siguen presentes y la sesión continúa

#### Scenario: Sin datos heredados
- **WHEN** el navegador no tiene ninguna de las claves
- **THEN** la limpieza no produce errores ni cambios

#### Scenario: Almacenamiento no disponible
- **WHEN** el acceso a `localStorage` lanza una excepción
- **THEN** la aplicación sigue funcionando sin mostrar error

### Requirement: Documentación del frontend
El `README` del frontend SHALL indicar que la aplicación requiere el backend y la variable `NEXT_PUBLIC_API_URL`, y SHALL NOT mencionar datos simulados.

#### Scenario: Instrucciones de arranque
- **WHEN** alguien lee `frontend/README.md`
- **THEN** encuentra cómo configurar `NEXT_PUBLIC_API_URL` y que se necesita el backend en ejecución
