import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../student/entities/student.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { TaskCheckinBodyDto } from './dto/task-checkin.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskCheckin } from './entities/task-checkin.entity';
import { Task } from './entities/task.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskCheckin)
    private readonly checkinRepo: Repository<TaskCheckin>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async create(dto: CreateTaskDto) {
    this.ensureTimeRange(dto.startTime, dto.endTime);
    const entity = this.taskRepo.create({
      name: dto.name,
      type: dto.type,
      gradeIds: dto.gradeIds,
      classIds: dto.classIds,
      projectIds: dto.projectIds,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      status: 'draft',
    });
    const saved = await this.taskRepo.save(entity);
    return this.findOne(saved.id);
  }

  async findAll(query: QueryTaskDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const qb = this.taskRepo
      .createQueryBuilder('t')
      .orderBy('t.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    const [rows, total] = await qb.getManyAndCount();
    return { items: rows, total, page, pageSize };
  }

  async findOne(id: number) {
    const row = await this.taskRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('任务不存在');
    }
    return row;
  }

  async update(id: number, dto: UpdateTaskDto) {
    const row = await this.taskRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('任务不存在');
    }
    const start = dto.startTime ?? row.startTime.toISOString();
    const end = dto.endTime ?? row.endTime.toISOString();
    this.ensureTimeRange(start, end);

    if (dto.name !== undefined) row.name = dto.name;
    if (dto.type !== undefined) row.type = dto.type;
    if (dto.gradeIds !== undefined) row.gradeIds = dto.gradeIds;
    if (dto.classIds !== undefined) row.classIds = dto.classIds;
    if (dto.projectIds !== undefined) row.projectIds = dto.projectIds;
    if (dto.startTime !== undefined) row.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) row.endTime = new Date(dto.endTime);

    await this.taskRepo.save(row);
    return this.findOne(id);
  }

  async remove(id: number) {
    const row = await this.taskRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('任务不存在');
    }
    await this.taskRepo.remove(row);
    return { ok: true };
  }

  async publish(id: number) {
    const row = await this.taskRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('任务不存在');
    }
    if (row.status === 'cancelled') {
      throw new BadRequestException('已取消的任务不能发布');
    }
    if (row.status === 'finished') {
      throw new BadRequestException('已完成的任务不能重新发布');
    }
    row.status = 'ongoing';
    await this.taskRepo.save(row);
    return this.findOne(id);
  }

  async cancel(id: number) {
    const row = await this.taskRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('任务不存在');
    }
    if (row.status === 'finished') {
      throw new BadRequestException('已完成的任务不能取消');
    }
    row.status = 'cancelled';
    await this.taskRepo.save(row);
    return this.findOne(id);
  }

  async finish(id: number) {
    const row = await this.taskRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('任务不存在');
    }
    if (row.status !== 'ongoing') {
      throw new BadRequestException('仅进行中的任务可以标记完成');
    }
    row.status = 'finished';
    await this.taskRepo.save(row);
    return this.findOne(id);
  }

  /** 任务下各学生检录状态（用于端上初始化 Switch） */
  async listCheckins(taskId: number) {
    await this.findOne(taskId);
    const rows = await this.checkinRepo.find({
      where: { taskId },
      order: { studentId: 'ASC' },
    });
    return {
      items: rows.map((r) => ({
        studentId: r.studentId,
        checked: r.checked,
      })),
    };
  }

  /** 更新单个学生检录状态 */
  async setCheckin(taskId: number, dto: TaskCheckinBodyDto) {
    const task = await this.findOne(taskId);
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new NotFoundException('学生不存在');
    }
    const classIds = task.classIds ?? [];
    if (!classIds.includes(student.classId)) {
      throw new BadRequestException('学生不属于该任务关联班级');
    }
    let row = await this.checkinRepo.findOne({
      where: { taskId, studentId: dto.studentId },
    });
    if (!row) {
      row = this.checkinRepo.create({
        taskId,
        studentId: dto.studentId,
        checked: dto.checked,
      });
    } else {
      row.checked = dto.checked;
    }
    await this.checkinRepo.save(row);
    return {
      taskId,
      studentId: dto.studentId,
      checked: row.checked,
    };
  }

  private ensureTimeRange(startTime: string, endTime: string) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) {
      throw new BadRequestException('时间格式无效');
    }
    if (end <= start) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }
  }
}
