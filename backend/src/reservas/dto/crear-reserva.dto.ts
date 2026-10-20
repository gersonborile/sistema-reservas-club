import { IsUUID, ValidateIf } from 'class-validator';

export class CrearReservaDto {
  @IsUUID(undefined, {
    message: 'El campo turnoId debe ser un UUID válido.',
  })
  turnoId!: string;

  @ValidateIf((_objeto, valor) => valor !== undefined && valor !== null)
  @IsUUID(undefined, {
    message: 'El campo usuarioId debe ser un UUID válido.',
  })
  usuarioId?: string;
}
