import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/** 注册仅允许管理员或教师账号 */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password: string;

  @IsIn(['admin', 'teacher'], { message: 'role 仅支持 admin 或 teacher' })
  role: 'admin' | 'teacher';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
