import { Type } from 'class-transformer';
import { IsBoolean, IsInt, Min } from 'class-validator';

export class TaskCheckinBodyDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId: number;

  @IsBoolean()
  checked: boolean;
}
