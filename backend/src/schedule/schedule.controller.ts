import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@UseGuards(JwtAuthGuard)
@Controller('course-schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  private actor(req: Request & { user: { id: number; role: string } }) {
    return { id: req.user.id, role: req.user.role };
  }

  @Get()
  findAll(
    @Query() query: {
      classId?: number;
      teacherId?: number;
      dayOfWeek?: number;
      schoolYear?: string;
      semester?: number;
    },
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scheduleService.findAll(query, this.actor(req));
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scheduleService.findOne(id, this.actor(req));
  }

  @Post()
  create(
    @Body() dto: CreateScheduleDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scheduleService.create(dto, this.actor(req));
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scheduleService.update(id, dto, this.actor(req));
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scheduleService.remove(id, this.actor(req));
  }
}
