import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class UpdateScoreDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  project?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  result?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  unit?: string;
}
