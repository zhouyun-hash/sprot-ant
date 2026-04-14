import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FaceLoginDto } from './dto/face-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ParentSmsLoginDto } from './dto/parent-sms-login.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { VerifySmsDto } from './dto/verify-sms.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 登录：校验 user 表 bcrypt 密码，返回 access_token 与脱敏 user。
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * 注册管理员或教师（密码 bcrypt）；成功可直接携带 token。
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * 人脸登录：提交图片 base64，经阿里云 SearchFace 匹配后按 user.id 签发 JWT。
   */
  @Post('face-login')
  async faceLogin(@Body() dto: FaceLoginDto) {
    return this.authService.faceLogin(dto);
  }

  /** 发送短信验证码（阿里云 SMS + Redis，5 分钟有效） */
  @Post('send-sms')
  async sendSms(@Body() dto: SendSmsDto) {
    return this.authService.sendSms(dto);
  }

  /** 校验短信验证码（找回密码等可复用） */
  @Post('verify-sms')
  async verifySms(@Body() dto: VerifySmsDto) {
    return this.authService.verifySms(dto);
  }

  /** 家长端：仅登记在学生「家长手机」中的号码可收验证码 */
  @Post('parent/send-sms')
  async sendParentLoginSms(@Body() dto: SendSmsDto) {
    return this.authService.sendParentLoginSms(dto);
  }

  /** 家长端：短信验证码登录 */
  @Post('parent/login-sms')
  async loginParentSms(@Body() dto: ParentSmsLoginDto) {
    return this.authService.loginParentWithSms(dto.phone, dto.code);
  }
}
