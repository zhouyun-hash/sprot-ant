import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ApplyParentAccessDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  studentNo: string;

  /** 身份证号（与学校登记一致） */
  @IsString()
  @IsNotEmpty()
  @Length(6, 32)
  idCard: string;
}
