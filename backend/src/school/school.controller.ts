import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateCampusDto } from './dto/create-campus.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('schools')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get()
  findAll(
    @Query() query: { page?: number; size?: number; keyword?: string },
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.schoolService.findAll(query, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.schoolService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSchoolDto) {
    return this.schoolService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateSchoolDto) {
    return this.schoolService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.schoolService.remove(id);
  }

  @Get(':id/campuses')
  findCampuses(@Param('id') id: number) {
    return this.schoolService.findCampuses(id);
  }

  @Post(':id/campuses')
  createCampus(@Param('id') id: number, @Body() dto: CreateCampusDto) {
    dto.schoolId = id;
    return this.schoolService.createCampus(dto);
  }

  @Delete('campuses/:campusId')
  removeCampus(@Param('campusId') campusId: number) {
    return this.schoolService.removeCampus(campusId);
  }
}
