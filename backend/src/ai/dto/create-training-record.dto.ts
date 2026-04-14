import { IsIn, IsObject, IsString } from 'class-validator';

export class CreateTrainingRecordDto {
  @IsString()
  @IsIn(['跳绳', '仰卧起坐', '立定跳远', '跑步'])
  project: '跳绳' | '仰卧起坐' | '立定跳远' | '跑步';

  @IsObject()
  resultJson: Record<string, unknown>;
}
