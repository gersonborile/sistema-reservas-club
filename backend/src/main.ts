import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { validationPipe } from './comun/validation-pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableShutdownHooks();
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
  });
  app.useGlobalPipes(validationPipe);

  const documento = new DocumentBuilder()
    .setTitle('Club Deportivo API')
    .setDescription(
      'API de reservas de canchas, equipamiento y pagos del club. ' +
        'Todas las rutas salvo el registro y login requieren JWT (Bearer).',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, documento),
  );

  await app.listen(config.get<number>('PORT') ?? 3001);
}
await bootstrap();
