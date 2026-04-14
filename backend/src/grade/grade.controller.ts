import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { GradeService } from './grade.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type ReqUser = Request & { user: { id: number; role: string } };

@UseGuards(JwtAuthGuard)
@Controller('grades')
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Get()
  findAll(
    @Query()
    query: {
      page?: number;
      size?: number;
      keyword?: string;
      schoolYear?: string;
      schoolId?: number;
    },
    @Req() req: ReqUser,
  ) {
    return this.gradeService.findAll(query, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @Req() req: ReqUser) {
    return this.gradeService.findOne(id, req.user);
  }

  @Post()
  create(@Body() dto: CreateGradeDto, @Req() req: ReqUser) {
    return this.gradeService.create(dto, req.user);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateGradeDto, @Req() req: ReqUser) {
    return this.gradeService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @Req() req: ReqUser) {
    return this.gradeService.remove(id, req.user);
  }
}
