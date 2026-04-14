import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBackupDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() operator?: string;
}
