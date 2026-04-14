import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSystemConfigDto {
  @IsNotEmpty() @IsString() configKey: string;
  @IsOptional() @IsString() configValue?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
}
