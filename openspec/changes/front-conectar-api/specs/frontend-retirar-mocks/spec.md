# Spec Delta

## ADDED Requirements

### Requirement: Sin datos ni acciones simuladas en la UI
El frontend SHALL NOT simular datos ni acciones de dominio con `setTimeout`, arrays hardcodeados, estados locales de reservas, precios, fotos, ratings o cantidades fijas. Toda acción visible de reserva SHALL llamar al backend y todo dato mostrado SHALL provenir de una respuesta del backend o de texto genérico de interfaz.

#### Scenario: Búsqueda de simulación
- **WHEN** se busca `setTimeout` en las pantallas de Home, canchas, reserva y Mis reservas
- **THEN** no hay usos para simular reservas, demoras ni datos

#### Scenario: Canchas sin datos fijos
- **WHEN** se revisa la Home autenticada
- **THEN** no hay nombres de canchas, disciplinas, precios ni horarios hardcodeados

#### Scenario: Acción de reserva real
- **WHEN** el socio confirma una reserva
- **THEN** la acción llama a `POST /reservas` y no a un temporizador local

### Requirement: Elementos del diseño sin respaldo
Los elementos visuales que muestran datos que el backend no provee SHALL eliminarse o reemplazarse por datos reales. Como mínimo se eliminan precios de cancha, fotos por cancha, superficies y amenities inventadas, "Socio Activo #N", QR, check-in digital, rating, dirección, teléfono, email y redes sociales sin respaldo.

#### Scenario: Tarjeta de próxima reserva
- **WHEN** se muestra la próxima reserva
- **THEN** solo aparecen cancha, fecha, horario y estado devueltos por `GET /reservas/mis`, sin código QR ni check-in

#### Scenario: Pie de página
- **WHEN** se muestra el pie de la Home
- **THEN** no aparecen dirección, teléfono, email ni redes inventadas

#### Scenario: Datos de contacto
- **WHEN** el backend no expone datos de contacto
- **THEN** la UI no los inventa y muestra un texto neutro o los omite
