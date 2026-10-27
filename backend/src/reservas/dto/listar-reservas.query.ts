import { IsUUID, ValidateIf } from 'class-validator';

export class ListarReservasQueryDto {
  @ValidateIf((_objeto, valor) => valor !== undefined && valor !== null)
  @IsUUID(undefined, {
    message: 'El campo usuarioId debe ser un UUID válido.',
  })
  usuarioId?: string;
}
