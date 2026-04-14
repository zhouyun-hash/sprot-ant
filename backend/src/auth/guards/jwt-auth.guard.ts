import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 保护需要登录的接口：请求头需携带 Bearer JWT。
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
