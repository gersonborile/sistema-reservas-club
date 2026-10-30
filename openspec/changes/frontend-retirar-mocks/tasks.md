## 1. Retiro del mock

- [ ] 1.1 Buscar referencias a `mock-reservas` en el frontend, trasladar a `lib/tipos.ts` cualquier tipo que aún se importe de ahí y eliminar `lib/mock-reservas.ts`, y verificar con `typecheck` y `build` que no queda ninguna referencia
- [ ] 1.2 Eliminar comentarios y constantes del mock que hayan quedado obsoletos en `lib/api.ts` y `lib/sesion.ts`

## 2. Limpieza de datos heredados

- [ ] 2.1 Implementar `limpiarDatosHeredados()` en `lib/almacen-sesion.ts` (borra las cuatro claves del mock, idempotente, dentro de `try/catch`, sin tocar token, usuario ni `theme`) y ejecutarla una vez por carga en el layout raíz
- [ ] 2.2 Verificar en el navegador que, con las cuatro claves presentes, quedan borradas tras cargar la aplicación y que la sesión iniciada no se pierde

## 3. Documentación e integración

- [ ] 3.1 Actualizar `frontend/README.md` (requiere backend y `NEXT_PUBLIC_API_URL`, sin datos simulados)
- [ ] 3.2 Correr `typecheck`, `lint` y `build` del frontend y verificar que terminan sin errores
- [ ] 3.3 Con backend y Postgres locales, recorrer a mano socio (Home, Canchas, reservar, Mis reservas, cancelar) y administrador (Resumen, Canchas, Equipamiento, Turnos, Reservas) y verificar que ninguna pantalla usa datos simulados
- [ ] 3.4 Tras el deploy, verificar en `https://matchpoint.alquilerespunilla.com.ar` el recorrido completo de socio y de administrador
