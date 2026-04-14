import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryHomeworkDto } from '../homework/dto/query-homework.dto';
import { QueryScoreDto } from '../score/dto/query-score.dto';
import { SubmitHomeworkDto } from '../homework/dto/submit-homework.dto';
import { HomeworkService } from '../homework/homework.service';
import { ReportService } from '../report/report.service';
import { ScoreService } from '../score/score.service';
import { Student } from '../student/entities/student.entity';
import { StudentService } from '../student/student.service';
import { User } from '../user/entities/user.entity';
import { ParentStudentAccess } from './entities/parent-student-access.entity';
import { ParentStudentAccessService } from './parent-student-access.service';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(ParentStudentAccess)
    private readonly accessRepo: Repository<ParentStudentAccess>,
    private readonly accessService: ParentStudentAccessService,
    private readonly studentService: StudentService,
    private readonly reportService: ReportService,
    private readonly homeworkService: HomeworkService,
    private readonly scoreService: ScoreService,
  ) {}

  async getChildren(parentUserId: number) {
    const user = await this.userRepo.findOne({ where: { id: parentUserId } });
    if (!user || user.role !== 'parent') {
      throw new ForbiddenException('仅家长可访问');
    }
    const phone = (user.phone ?? '').trim();
    if (!phone) {
      return { items: [] };
    }
    const students = await this.studentRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'u')
      .leftJoinAndSelect('s.schoolClass', 'c')
      .where('TRIM(s.parent_phone) = :p', { p: phone })
      .orderBy('s.id', 'ASC')
      .getMany();

    const accesses = await this.accessRepo.find({
      where: { parentUserId },
    });
    const bySid = new Map(accesses.map((a) => [Number(a.studentId), a.status]));

    return {
      items: students.map((s) => {
        const st = bySid.get(Number(s.id));
        const accessStatus = st ?? 'none';
        return this.mapChild(s, accessStatus);
      }),
    };
  }

  private mapChild(s: Student, accessStatus: string) {
    return {
      id: s.id,
      studentNo: s.studentNo,
      className: s.schoolClass?.name ?? null,
      grade: s.schoolClass?.grade ?? null,
      accessStatus,
      user: s.user
        ? {
            id: s.user.id,
            name: s.user.name,
            avatar: s.user.avatar,
          }
        : null,
    };
  }

  async ensureParentOwnsStudent(
    parentUserId: number,
    studentId: number,
  ): Promise<Student> {
    const parent = await this.userRepo.findOne({ where: { id: parentUserId } });
    const phone = (parent?.phone ?? '').trim();
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['user', 'schoolClass'],
    });
    if (
      !parent ||
      parent.role !== 'parent' ||
      !phone ||
      !student ||
      (student.parentPhone ?? '').trim() !== phone
    ) {
      throw new ForbiddenException('无权查看该学生');
    }
    await this.accessService.ensureApprovedAccess(parentUserId, studentId);
    return student;
  }

  async statsWeek(studentId: number, parentUserId: number) {
    await this.ensureParentOwnsStudent(parentUserId, studentId);
    return this.studentService.getWeekStatsByStudentId(studentId);
  }

  async activityTrend(studentId: number, parentUserId: number) {
    await this.ensureParentOwnsStudent(parentUserId, studentId);
    return this.studentService.getActivityTrend7Days(studentId);
  }

  async report(studentId: number, parentUserId: number) {
    await this.ensureParentOwnsStudent(parentUserId, studentId);
    return this.reportService.getOrGenerateStudentReport(studentId);
  }

  /** 孩子体测成绩列表（与家长身份绑定） */
  async studentScores(
    studentId: number,
    parentUserId: number,
    query: QueryScoreDto,
  ) {
    await this.ensureParentOwnsStudent(parentUserId, studentId);
    return this.scoreService.findAll(
      {
        ...query,
        studentId,
      },
      { id: parentUserId, role: 'parent' },
    );
  }

  /** 孩子体质报告历史 */
  async reportHistory(
    studentId: number,
    parentUserId: number,
    page: number,
    pageSize: number,
  ) {
    await this.ensureParentOwnsStudent(parentUserId, studentId);
    return this.reportService.getStudentReportHistory(studentId, page, pageSize);
  }

  async homeworkList(
    studentId: number,
    query: QueryHomeworkDto,
    parentUserId: number,
  ) {
    await this.ensureParentOwnsStudent(parentUserId, studentId);
    return this.homeworkService.findAllForStudentId(studentId, query);
  }

  async homeworkDetail(
    homeworkId: number,
    studentId: number,
    parentUserId: number,
  ) {
    await this.ensureParentOwnsStudent(parentUserId, studentId);
    return this.homeworkService.findOneForParentViewer(
      homeworkId,
      studentId,
      parentUserId,
    );
  }

  async homeworkSubmit(
    homeworkId: number,
    studentId: number,
    dto: SubmitHomeworkDto,
    parentUserId: number,
  ) {
    await this.ensureParentOwnsStudent(parentUserId, studentId);
    return this.homeworkService.submitForParent(
      homeworkId,
      studentId,
      dto,
      parentUserId,
    );
  }

  /** 体测各项目最好成绩 */
  async bestPhysicalScores(studentId: number, parentUserId: number) {
    await this.ensureParentOwnsStudent(parentUserId, studentId);
    return this.scoreService.getBestScoresPerProject(studentId);
  }
}
