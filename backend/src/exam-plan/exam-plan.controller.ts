import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExamPlanService } from './exam-plan.service';
import { CreateExamPlanDto } from './dto/create-exam-plan.dto';
import { UpdateExamPlanDto } from './dto/update-exam-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('exam-plans')
export class ExamPlanController {
  constructor(private readonly service: ExamPlanService) {}

  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id')
  findOne(@Param('id') id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateExamPlanDto) { return this.service.create(dto); }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateExamPlanDto) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: number) { return this.service.remove(id); }
}
