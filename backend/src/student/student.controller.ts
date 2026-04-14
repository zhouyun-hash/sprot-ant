import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { QueryTrainingRecordDto } from './dto/query-training-record.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  private actor(req: Request & { user: { id: number; role: string; username?: string } }) {
    return { id: req.user.id, role: req.user.role, username: req.user.username };
  }

  @Post()
  create(
    @Body() dto: CreateStudentDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.studentService.create(dto, this.actor(req));
  }

  @Get()
  findAll(
    @Query() query: QueryStudentDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.studentService.findAll(query, this.actor(req));
  }

  /** 当前学生本人档案（含 user 头像） */
  @Get('me')
  me(@Req() req: Request & { user: { id: number; role: string } }) {
    if (req.user.role !== 'student') {
      throw new ForbiddenException('仅学生可访问');
    }
    return this.studentService.findMineByUserId(req.user.id);
  }

  /** 本周运动概览（近 7 天） */
  @Get('me/stats-week')
  myWeekStats(@Req() req: Request & { user: { id: number; role: string } }) {
    if (req.user.role !== 'student') {
      throw new ForbiddenException('仅学生可访问');
    }
    return this.studentService.getMyWeekStats(req.user.id);
  }

  @Get('import/template')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header(
    'Content-Disposition',
    'attachment; filename="student-import-template.xlsx"',
  )
  downloadImportTemplate() {
    return this.studentService.buildImportTemplate();
  }

  @Get(':studentId/training-records')
  findTrainingRecords(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: QueryTrainingRecordDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.studentService.findTrainingRecordsByStudentId(
      studentId,
      query,
      req.user,
    );
  }

  @Get(':studentId/training-records/:recordId')
  findTrainingRecordDetail(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.studentService.findTrainingRecordDetail(
      studentId,
      recordId,
      req.user,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.studentService.findOne(id, this.actor(req));
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.studentService.update(id, dto, this.actor(req));
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.studentService.remove(id, this.actor(req));
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    if (!file) {
      throw new BadRequestException('请上传 Excel 文件');
    }
    return this.studentService.importFromExcel(file.buffer, this.actor(req));
  }
}
