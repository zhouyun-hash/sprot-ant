import { IsString, Length, Matches } from 'class-validator';

export class ParentSmsLoginDto {
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone: string;

  @IsString()
  @Length(6, 6, { message: '验证码为 6 位数字' })
  @Matches(/^\d{6}$/, { message: '验证码须为数字' })
  code: string;
}
