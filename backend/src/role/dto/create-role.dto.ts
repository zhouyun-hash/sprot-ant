import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() code: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() permissions?: string[];
}
