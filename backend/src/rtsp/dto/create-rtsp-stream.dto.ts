import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateRtspStreamDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() url: string;
  @IsOptional() @IsNumber() deviceId?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() protocol?: string;
  @IsOptional() @IsString() resolution?: string;
  @IsOptional() @IsNumber() fps?: number;
  @IsOptional() @IsNumber() latency?: number;
  @IsOptional() @IsNumber() encrypted?: number;
}
