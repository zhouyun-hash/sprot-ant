import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { Student } from '../student/entities/student.entity';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { AliyunFaceService } from './services/aliyun-face.service';
import { AliyunSmsService } from './services/aliyun-sms.service';
import { FaceLoginDto } from './dto/face-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { VerifySmsDto } from './dto/verify-sms.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { stripBase64DataUrl } from './utils/base64.util';

const BCRYPT_ROUNDS = 10;
const SMS_CODE_PREFIX = 'sms:code:';
const SMS_CODE_TTL_SECONDS = 300;
/** 同一手机号两次发送最小间隔（秒）；与验证码 TTL 共用 key，用剩余 TTL 判断 */
const SMS_RESEND_INTERVAL_SECONDS = 60;
const SMS_COOLDOWN_MIN_REMAINING_TTL =
  SMS_CODE_TTL_SECONDS - SMS_RESEND_INTERVAL_SECONDS;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly aliyunFace: AliyunFaceService,
    private readonly redis: RedisService,
    private readonly aliyunSms: AliyunSmsService,
    private readonly roleService: RoleService,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async validateUser(username: string, plainPassword: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      return null;
    }
    try {
      const hash = user.password ?? '';
      const ok = await bcrypt.compare(plainPassword, hash);
      if (!ok) {
        return null;
      }
    } catch {
      // 非法/损坏的哈希等：视为校验失败，避免未捕获异常变 500
      return null;
    }
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.username, dto.password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.role === 'parent' || user.role === 'student') {
      throw new UnauthorizedException(
        '学生、家长账号请使用移动端短信验证码登录，不在此使用密码登录',
      );
    }
    const id = Number(user.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new InternalServerErrorException('用户 ID 非法');
    }
    const payload: JwtPayload = {
      sub: id,
      username: String(user.username),
      role: String(user.role),
    };
    let access_token: string;
    try {
      access_token = await this.jwtService.signAsync(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`JWT 签发失败: ${msg}`);
    }
    let permissions: string[] = [];
    try {
      const roleEntity = await this.roleService.findByCode(String(user.role));
      if (roleEntity?.permissions) {
        permissions = roleEntity.permissions;
      }
    } catch {
      // 角色不存在或查询失败不影响登录
    }

    try {
      return {
        access_token,
        user: this.userService.toPublic(user),
        permissions,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`响应序列化失败: ${msg}`);
    }
  }

  async register(dto: RegisterDto) {
    const exists = await this.userService.findByUsername(dto.username);
    if (exists) {
      throw new ConflictException('用户名已存在');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.userService.create({
      username: dto.username,
      passwordHash,
      role: dto.role,
      name: dto.name,
      phone: dto.phone ?? null,
    });
    const payload: JwtPayload = {
      sub: Number(user.id),
      username: user.username,
      role: user.role,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      user: this.userService.toPublic(user),
    };
  }

  /**
   * 人脸登录：SearchFace 得到 EntityId（需与 user.id 一致），再签发 JWT。
   */
  async faceLogin(dto: FaceLoginDto) {
    const raw = stripBase64DataUrl(dto.imageBase64);
    const match = await this.aliyunFace.searchFace(raw);
    if (!match) {
      throw new UnauthorizedException('未匹配到人脸或置信度不足');
    }
    const userId = Number.parseInt(match.entityId, 10);
    if (Number.isNaN(userId)) {
      throw new BadRequestException(
        '人脸库 EntityId 需与业务 user.id 一致（录入 AddFace 时使用 String(user.id)）',
      );
    }
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    const payload: JwtPayload = {
      sub: Number(user.id),
      username: user.username,
      role: user.role,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      user: this.userService.toPublic(user),
    };
  }

  /**
   * 发送短信验证码：6 位数字，写入 Redis TTL 5 分钟。
   * 同一手机号 60 秒内重复请求会拒绝（不调用短信接口）。
   */
  async sendSms(dto: SendSmsDto) {
    const key = `${SMS_CODE_PREFIX}${dto.phone}`;
    try {
      const ttl = await this.redis.getClient().ttl(key);
      if (ttl > SMS_COOLDOWN_MIN_REMAINING_TTL) {
        const waitSec = ttl - SMS_COOLDOWN_MIN_REMAINING_TTL;
        throw new BadRequestException(
          `发送过于频繁，请 ${waitSec} 秒后再试`,
        );
      }
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new ServiceUnavailableException(
        `无法校验发送频率: ${(e as Error).message}`,
      );
    }

    const code = String(randomInt(100000, 1000000));
    await this.aliyunSms.sendVerificationCode(dto.phone, code);
    try {
      await this.redis.getClient().setex(key, SMS_CODE_TTL_SECONDS, code);
    } catch (e) {
      throw new ServiceUnavailableException(
        `验证码已发送但暂无法保存，请稍后重试: ${(e as Error).message}`,
      );
    }
    return { ok: true, message: '验证码已发送', expiresIn: SMS_CODE_TTL_SECONDS };
  }

  /**
   * 校验短信验证码（找回密码等场景可复用）；成功后删除 Redis 中的验证码。
   */
  async verifySms(dto: VerifySmsDto) {
    const key = `${SMS_CODE_PREFIX}${dto.phone}`;
    let stored: string | null;
    try {
      stored = await this.redis.getClient().get(key);
    } catch (e) {
      throw new ServiceUnavailableException(
        `无法读取验证码: ${(e as Error).message}`,
      );
    }
    if (!stored) {
      throw new BadRequestException('验证码已过期或不存在，请重新获取');
    }
    if (stored !== dto.code) {
      throw new BadRequestException('验证码错误');
    }
    await this.redis.getClient().del(key);
    return { ok: true, message: '验证通过' };
  }

  /** 家长手机号是否在学校「学生管理」中登记为家长联系方式 */
  async isParentPhoneWhitelisted(phone: string): Promise<boolean> {
    const p = (phone ?? '').trim();
    if (!p) return false;
    const n = await this.studentRepo
      .createQueryBuilder('s')
      .where('TRIM(s.parent_phone) = :p', { p })
      .getCount();
    return n > 0;
  }

  /**
   * 家长端登录专用：仅已向学校登记的家长手机号可收验证码。
   */
  async sendParentLoginSms(dto: SendSmsDto) {
    const ok = await this.isParentPhoneWhitelisted(dto.phone);
    if (!ok) {
      throw new ForbiddenException(
        '该手机号无权登录，请向校方申请开放权限',
      );
    }
    return this.sendSms(dto);
  }

  /**
   * 家长短信验证码登录：校验验证码后签发 JWT（permissions 为空，由业务接口再鉴权）。
   */
  async loginParentWithSms(phone: string, code: string) {
    const ok = await this.isParentPhoneWhitelisted(phone);
    if (!ok) {
      throw new ForbiddenException(
        '该手机号无权登录，请向校方申请开放权限',
      );
    }
    const key = `${SMS_CODE_PREFIX}${phone}`;
    let stored: string | null;
    try {
      stored = await this.redis.getClient().get(key);
    } catch (e) {
      throw new ServiceUnavailableException(
        `无法读取验证码: ${(e as Error).message}`,
      );
    }
    if (!stored) {
      throw new BadRequestException('验证码已过期或不存在，请重新获取');
    }
    if (stored !== code) {
      throw new BadRequestException('验证码错误');
    }
    await this.redis.getClient().del(key);

    const user = await this.userService.findOrCreateParentByPhone(phone);
    const id = Number(user.id);
    const payload: JwtPayload = {
      sub: id,
      username: String(user.username),
      role: 'parent',
    };
    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      user: this.userService.toPublic(user),
      permissions: [] as string[],
    };
  }
}
