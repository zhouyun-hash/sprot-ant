import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAppVersionDto {
  @IsNotEmpty() @IsString() platform: string;
  @IsNotEmpty() @IsString() version: string;
  @IsOptional() @IsString() downloadUrl?: string;
  @IsOptional() @IsNumber() forceUpdate?: number;
  @IsOptional() @IsString() releaseNotes?: string;
}
