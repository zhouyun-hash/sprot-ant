import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateDeviceDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() type: string;
  @IsNotEmpty() @IsString() sn: string;
  @IsOptional() @IsString() ip?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() firmwareVersion?: string;
  @IsOptional() @IsNumber() schoolId?: number;
  @IsOptional() @IsString() location?: string;
}
