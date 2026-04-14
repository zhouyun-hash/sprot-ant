import { Matches } from 'class-validator';

/** 中国大陆手机号 11 位 */
export class SendSmsDto {
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone: string;
}
