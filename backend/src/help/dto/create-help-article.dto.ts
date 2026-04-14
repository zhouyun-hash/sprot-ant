import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateHelpArticleDto {
  @IsNotEmpty() @IsString() title: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}
