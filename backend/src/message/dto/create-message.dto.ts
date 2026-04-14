import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty() @IsString() title: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() targetType?: string;
  @IsOptional() @IsArray() targetIds?: any[];
  @IsOptional() @IsNumber() senderId?: number;
}
