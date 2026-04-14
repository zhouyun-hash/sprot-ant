import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeachingPlanService } from './teaching-plan.service';
import { CreateTeachingPlanDto } from './dto/create-teaching-plan.dto';
import { UpdateTeachingPlanDto } from './dto/update-teaching-plan.dto';

@UseGuards(JwtAuthGuard)
@Controller('teaching-plans')
export class TeachingPlanController {
  constructor(private readonly teachingPlanService: TeachingPlanService) {}

  @Get()
  findAll(
    @Query() query: {
      page?: number;
      size?: number;
      keyword?: string;
      teacherId?: number;
      status?: string;
    },
  ) {
    return this.teachingPlanService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.teachingPlanService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTeachingPlanDto) {
    return this.teachingPlanService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateTeachingPlanDto) {
    return this.teachingPlanService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.teachingPlanService.remove(id);
  }
}
