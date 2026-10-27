import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Cliente de Prisma dentro de una transacción (`$transaction`).
 * Se declara acá porque `Prisma.TransactionClient` del client generado
 * se resuelve a un tipo vacío (el runtime no expone sus declaraciones).
 */
export type ClienteTransaccion = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.getOrThrow<string>('DATABASE_URL'),
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conexión con la base de datos establecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Envuelve el `$transaction` de Prisma tipando el `tx` con
   * `ClienteTransaccion`, cuyo Omit sí preserva los modelos.
   */
  async transaccion<T>(correr: (tx: ClienteTransaccion) => Promise<T>): Promise<T> {
    return (await this.$transaction(async () => {
      return correr(this as never);
    })) as T;
  }
}