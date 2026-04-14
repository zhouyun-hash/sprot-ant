import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExercisePrescriptionService } from './exercise-prescription.service';
import { CreateExercisePrescriptionDto } from './dto/create-exercise-prescription.dto';
import { UpdateExercisePrescriptionDto } from './dto/update-exercise-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('exercise-prescriptions')
export class ExercisePrescriptionController {
  constructor(private readonly service: ExercisePrescriptionService) {}

  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id')
  findOne(@Param('id') id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateExercisePrescriptionDto) { return this.service.create(dto); }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateExercisePrescriptionDto) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: number) { return this.service.remove(id); }
}
