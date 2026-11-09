## 1. Horario del club y zona horaria (backend)

- [ ] 1.1 Crear `turnos/horario-club.ts` con las constantes del horario, `franjasDelClub()` y `esFranjaDelClub()`, test-first, y verificar con unit tests las 14 franjas y los casos fuera de horario, desalineado y de otra duración
- [ ] 1.2 Agregar `hoyEnZonaClub()` y `aInstanteInicio()` en la zona del club, test-first, y verificar con unit tests el cruce de medianoche UTC y el instante de un turno de las 10:00
- [ ] 1.3 Reemplazar `esFechaPasada` y `aInstanteInicioUtc` en `turnos.service.ts` y `reservas.service.ts`, y verificar con tests de servicio que un turno de hoy a la noche se puede crear y que «turno pasado» y la ventana de cancelación usan la hora de Argentina
- [ ] 1.4 Validar la franja en `POST /turnos` y `PATCH /turnos/:id` (400) y verificar con tests de servicio y e2e cada escenario de «Franjas del horario del club»; actualizar los datos de los tests existentes a franjas válidas
- [ ] 1.5 Anotar el horario, las franjas y la zona horaria como reglas en `openspec/config.yaml`

## 2. Generación en bloque (backend)

- [ ] 2.1 Crear `GenerarTurnosDto` y `POST /turnos/generar` (solo administrador) con las validaciones de rango, referencias y disciplina de la cancha, test-first, y verificar cada escenario de error con tests de servicio
- [ ] 2.2 Implementar la generación (consulta única de existentes, saltear superpuestos y franjas de hoy ya empezadas, `createMany` en transacción) y verificar con tests de servicio las cuentas de `creados` y `salteados`
- [ ] 2.3 Verificar con tests e2e 401, 403 y 201 con `{ creados, salteados }`
- [ ] 2.4 Pasar a 60 minutos el turno de fútbol del seed y verificar que el seed corre contra la base local

## 3. Panel del administrador (frontend)

- [ ] 3.1 Crear `lib/franjas.ts` y agregar `validarGeneracion()` y `generarTurnos()`, test-first, y verificar con Vitest las franjas, las reglas de rango y la llamada simulando solo `fetch`
- [ ] 3.2 Cambiar `dialogo-turno.tsx` a un selector de franja con hora de fin calculada y verificar en el navegador que crear y editar un turno siguen funcionando
- [ ] 3.3 Agregar el diálogo «Generar turnos» en `/admin/turnos` y verificar en el navegador la generación, el resultado mostrado, la lista actualizada y los errores de rango

## 4. Cierre

- [ ] 4.1 Correr `typecheck`, `lint` y tests de backend y frontend, y pasar `code-review`
- [ ] 4.2 Tras el deploy, generar en producción los turnos de las 2 semanas siguientes para las 4 canchas activas y verificar que un socio ve los turnos y puede reservar
