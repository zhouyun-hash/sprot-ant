import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateScoreItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  taskId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  project: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  result: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  unit: string;
}

export class CreateScoreDto extends CreateScoreItemDto {}

export class BatchCreateScoreDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateScoreItemDto)
  items: CreateScoreItemDto[];
}

export type CreateScorePayload = CreateScoreDto | BatchCreateScoreDto;
