import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  findAll(@Query() query: { page?: number; size?: number; keyword?: string }) {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.roleService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.roleService.remove(id);
  }

  @Post('assign')
  assignRole(@Body() body: { userId: number; roleId: number }) {
    return this.roleService.assignRole(body.userId, body.roleId);
  }

  @Delete('user/:userId/role/:roleId')
  removeUserRole(@Param('userId') userId: number, @Param('roleId') roleId: number) {
    return this.roleService.removeUserRole(userId, roleId);
  }

  @Get('user/:userId')
  getUserRoles(@Param('userId') userId: number) {
    return this.roleService.getUserRoles(userId);
  }
}
