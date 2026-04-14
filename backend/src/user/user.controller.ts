import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { RoleService } from '../role/role.service';

const SYSTEM_ROLES = new Set([
  'admin',
  'super_admin',
  'group_admin',
  'school_admin',
  'teacher',
  'student',
  'parent',
]);

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  private async resolveRoleCode(raw: string): Promise<string> {
    if (SYSTEM_ROLES.has(raw)) return raw;
    const role = await this.roleService.findByCode(raw);
    if (role && SYSTEM_ROLES.has(role.code)) return role.code;
    const byName =
      (await this.roleService.findAll({ page: 1, size: 200 })).rows.find(
        (r) => r.name === raw || String(r.id) === raw,
      );
    if (byName && SYSTEM_ROLES.has(byName.code)) return byName.code;
    throw new BadRequestException(
      `不合法的角色标识："${raw}"，允许的角色：${[...SYSTEM_ROLES].join(', ')}`,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: { page?: number; size?: number; keyword?: string; role?: string }) {
    return this.userService.findAllPublic(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: { id: number; username: string; role: string } }) {
    return req.user;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createUser(@Body() body: { username: string; password: string; name: string; role: string; phone?: string }) {
    const role = await this.resolveRoleCode(body.role);
    if (role === 'student' || role === 'parent') {
      throw new BadRequestException(
        '学生账号由系统随学籍创建；家长账号由家长手机号验证码登录自动开通，不可在此创建',
      );
    }
    return this.userService.createUser({ ...body, role });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateUser(@Param('id') id: number, @Body() body: { name?: string; role?: string; phone?: string }) {
    if (body.role !== undefined) {
      const role = await this.resolveRoleCode(body.role);
      if (role === 'student' || role === 'parent') {
        throw new BadRequestException(
          '不允许将角色修改为学生或家长；学生由学籍维护，家长通过手机验证码自动开通',
        );
      }
      body.role = role;
    }
    return this.userService.updateUser(id, body);
  }

  @Put(':id/reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Param('id') id: number, @Body() body: { password?: string }) {
    return this.userService.resetPassword(id, body?.password);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: number) {
    return this.userService.deleteUser(id);
  }
}
