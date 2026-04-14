import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParentStudentAccessService } from '../parent/parent-student-access.service';

type ReqUser = Request & { user: { id: number; role: string } };

function assertTeacherOrAdmin(role: string) {
  if (role !== 'teacher' && role !== 'admin' && role !== 'super_admin') {
    throw new ForbiddenException('仅教师或管理员可操作');
  }
}

@Controller('teachers/parent-access')
@UseGuards(JwtAuthGuard)
export class TeacherParentAccessController {
  constructor(private readonly access: ParentStudentAccessService) {}

  @Get('pending')
  pending(@Req() req: ReqUser) {
    assertTeacherOrAdmin(req.user.role);
    return this.access.listPendingForTeacher(req.user.id, req.user.role);
  }

  @Post('requests/:id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @Req() req: ReqUser) {
    assertTeacherOrAdmin(req.user.role);
    return this.access.approve(id, req.user.id, req.user.role);
  }

  @Post('requests/:id/reject')
  reject(@Param('id', ParseIntPipe) id: number, @Req() req: ReqUser) {
    assertTeacherOrAdmin(req.user.role);
    return this.access.reject(id, req.user.id, req.user.role);
  }
}
