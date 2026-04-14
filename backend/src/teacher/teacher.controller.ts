import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

type AuthedRequest = Request & {
  user: { id: number; role: string };
};

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  create(@Body() dto: CreateTeacherDto, @Req() req: AuthedRequest) {
    return this.teacherService.create(dto, req.user);
  }

  /** 当前教师任课班级（名称、学生数等） */
  @Get('me/classes')
  myClasses(@Req() req: AuthedRequest) {
    if (req.user.role !== 'teacher') {
      throw new ForbiddenException('仅教师可查看任课班级');
    }
    return this.teacherService.findMyClasses(req.user.id);
  }

  @Get()
  findAll(@Query() query: QueryTeacherDto, @Req() req: AuthedRequest) {
    return this.teacherService.findAll(query, req.user);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherDto,
    @Req() req: AuthedRequest,
  ) {
    return this.teacherService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedRequest) {
    return this.teacherService.remove(id, req.user);
  }
}
