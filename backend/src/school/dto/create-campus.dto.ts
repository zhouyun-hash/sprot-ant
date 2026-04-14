import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCampusDto {
  @IsNotEmpty() @IsNumber() schoolId: number;
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
}
