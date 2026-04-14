import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../student/entities/student.entity';
import { Task } from '../../task/entities/task.entity';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

@Entity('score')
export class Score {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'task_id', type: 'bigint', unsigned: true })
  taskId: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'student_id', type: 'bigint', unsigned: true })
  studentId: number;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ length: 64 })
  project: string;

  @Column({ length: 64 })
  result: string;

  @Column({ length: 32 })
  unit: string;

  @Column({ name: 'review_status', length: 16, default: 'pending' })
  reviewStatus: ReviewStatus;

  @Column({ name: 'review_remark', type: 'varchar', length: 255, nullable: true })
  reviewRemark: string | null;

  /** AI 原始推理数据 JSON */
  @Column({ name: 'ai_raw_data', type: 'json', nullable: true })
  aiRawData: Record<string, any> | null;

  /** 0=未上报 1=已上报 2=上报失败 */
  @Column({ name: 'sync_status', type: 'tinyint', unsigned: true, default: 0 })
  syncStatus: number;

  @Column({ name: 'sync_retry_count', type: 'tinyint', unsigned: true, default: 0 })
  syncRetryCount: number;

  @Column({ name: 'synced_at', type: 'datetime', precision: 3, nullable: true })
  syncedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
