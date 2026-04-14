import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateVenueDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsNumber() capacity?: number;
  @IsOptional() @IsString() facilities?: string;
  @IsOptional() @IsString() rules?: string;
  @IsOptional() @IsNumber() schoolId?: number;
}
