import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateBadgeDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() conditionType?: string;
  @IsOptional() @IsNumber() conditionValue?: number;
}
