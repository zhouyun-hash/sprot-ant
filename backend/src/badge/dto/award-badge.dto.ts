import { IsNotEmpty, IsNumber } from 'class-validator';

export class AwardBadgeDto {
  @IsNotEmpty() @IsNumber() badgeId: number;
  @IsNotEmpty() @IsNumber() studentId: number;
}
