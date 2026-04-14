import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateTeachingResourceDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 200)
  title: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['video', 'document', 'image', 'other'])
  type: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  category?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 512)
  fileUrl: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  uploaderId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  status?: string;
}
