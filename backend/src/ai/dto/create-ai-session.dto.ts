import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

export class CreateAiSessionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  taskId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  classId: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  project: string;
}
