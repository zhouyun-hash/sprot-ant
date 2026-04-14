import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

function randomPlaceholderPassword(): string {
  return `nopwd_${randomUUID()}`;
}

export type PublicUser = Omit<User, 'password'>;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    const p = (phone ?? '').trim();
    if (!p) return null;
    return this.userRepo.findOne({ where: { phone: p } });
  }

  /**
   * 家长端：按手机号查找或创建 parent 用户（无密码登录，占位密码仅满足表非空约束）
   */
  async findOrCreateParentByPhone(phone: string): Promise<User> {
    const p = phone.trim();
    const existing = await this.findByPhone(p);
    if (existing) {
      if (existing.role !== 'parent') {
        throw new ConflictException('该手机号已绑定其他类型账号');
      }
      return existing;
    }
    const hash = await bcrypt.hash(randomPlaceholderPassword(), 10);
    const username = `parent_${p}`;
    return this.create({
      username,
      passwordHash: hash,
      role: 'parent',
      name: `家长${p.slice(-4)}`,
      phone: p,
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(data: {
    username: string;
    passwordHash: string;
    role: string;
    name: string;
    phone?: string | null;
  }): Promise<User> {
    const entity = this.userRepo.create({
      username: data.username,
      password: data.passwordHash,
      role: data.role,
      name: data.name,
      phone: data.phone ?? null,
    });
    return this.userRepo.save(entity);
  }

  toPublic(user: User): PublicUser {
    return {
      id: Number(user.id),
      username: user.username,
      role: user.role,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      createdAt: user.createdAt,
    } as PublicUser;
  }

  async findAllPublic(query?: { page?: number; size?: number; keyword?: string; role?: string }) {
    const page = Number(query?.page) || 1;
    const size = Number(query?.size) || 20;
    const where: any = {};
    if (query?.keyword) {
      where.name = Like(`%${query.keyword}%`);
    }
    if (query?.role) {
      where.role = query.role;
    }
    const [list, total] = await this.userRepo.findAndCount({
      where,
      skip: (page - 1) * size,
      take: size,
      order: { id: 'DESC' },
    });
    return {
      rows: list.map((u) => this.toPublic(u)),
      total,
      page,
      size,
    };
  }

  async createUser(data: { username: string; password: string; name: string; role: string; phone?: string }) {
    const exists = await this.findByUsername(data.username);
    if (exists) throw new ConflictException('用户名已存在');
    const hash = await bcrypt.hash(data.password, 10);
    const user = await this.create({
      username: data.username,
      passwordHash: hash,
      role: data.role,
      name: data.name,
      phone: data.phone,
    });
    return this.toPublic(user);
  }

  async updateUser(id: number, data: { name?: string; role?: string; phone?: string }) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    if (data.name !== undefined) user.name = data.name;
    if (data.role !== undefined) user.role = data.role;
    if (data.phone !== undefined) user.phone = data.phone;
    await this.userRepo.save(user);
    return this.toPublic(user);
  }

  async resetPassword(id: number, newPassword?: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    const pwd = newPassword?.trim() || 'Admin123456';
    user.password = await bcrypt.hash(pwd, 10);
    await this.userRepo.save(user);
    return { message: '密码已重置' };
  }

  async deleteUser(id: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    await this.userRepo.delete(id);
    return { message: '删除成功' };
  }
}
