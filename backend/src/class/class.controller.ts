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
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { QueryClassDto } from './dto/query-class.dto';
import { QueryClassStudentsDto } from './dto/query-class-students.dto';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  private actor(req: Request & { user: { id: number; role: string; username?: string } }) {
    return { id: req.user.id, role: req.user.role, username: req.user.username };
  }

  @Post()
  create(
    @Body() dto: CreateClassDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.classService.create(dto, this.actor(req));
  }

  @Get()
  findAll(
    @Query() query: QueryClassDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.classService.findAll(query, this.actor(req));
  }

  @Get(':id/students')
  findStudents(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryClassStudentsDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.classService.findStudentsByClassId(id, query, this.actor(req));
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.classService.findOne(id, this.actor(req));
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.classService.update(id, dto, this.actor(req));
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.classService.remove(id, this.actor(req));
  }
}
