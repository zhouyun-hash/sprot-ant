import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class SelfTrainingDto {
  @IsString()
  @IsIn(['跳绳', '仰卧起坐', '立定跳远', '跑步'])
  project: '跳绳' | '仰卧起坐' | '立定跳远' | '跑步';

  @IsString()
  @Length(1)
  imageBase64: string;

  /** 为 false 时仅返回 AI 结果，不落库（用于端上高频截图分析） */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  persist?: boolean;
}
