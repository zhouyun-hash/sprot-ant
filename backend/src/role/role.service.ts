import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
  ) {}

  async findAll(query: { page?: number; size?: number; keyword?: string }) {
    const page = query.page || 1;
    const size = query.size || 50;
    const where: any = {};
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    const [rows, total] = await this.roleRepo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const role = await this.roleRepo.findOneBy({ id });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.roleRepo.findOneBy({ code });
  }

  async create(dto: CreateRoleDto) {
    const exists = await this.roleRepo.findOneBy({ code: dto.code });
    if (exists) throw new ConflictException('角色编码已存在');
    return this.roleRepo.save(this.roleRepo.create(dto));
  }

  async update(id: number, dto: UpdateRoleDto) {
    await this.findOne(id);
    await this.roleRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.userRoleRepo.delete({ roleId: id });
    await this.roleRepo.delete(id);
  }

  async assignRole(userId: number, roleId: number) {
    const exists = await this.userRoleRepo.findOneBy({ userId, roleId });
    if (exists) return exists;
    return this.userRoleRepo.save(this.userRoleRepo.create({ userId, roleId }));
  }

  async removeUserRole(userId: number, roleId: number) {
    await this.userRoleRepo.delete({ userId, roleId });
  }

  async getUserRoles(userId: number) {
    const userRoles = await this.userRoleRepo.find({ where: { userId } });
    if (!userRoles.length) return [];
    const roleIds = userRoles.map((ur) => ur.roleId);
    return this.roleRepo.findByIds(roleIds);
  }
}
