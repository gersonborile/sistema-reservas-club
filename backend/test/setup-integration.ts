import 'reflect-metadata';
import { config } from 'dotenv';

// TEST_DATABASE_URL apunta a una base aparte (nunca a la de desarrollo).
// Si no está definida, los tests de integración se saltean.
config({ path: '.env.test.local', quiet: true });
