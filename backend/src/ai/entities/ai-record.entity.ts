import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ai_record')
export class AiRecord {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'session_id', length: 64 })
  sessionId: string;

  @Column({ name: 'task_id', type: 'bigint', unsigned: true })
  taskId: number;

  @Column({ name: 'class_id', type: 'bigint', unsigned: true })
  classId: number;

  @Column({ name: 'student_id', type: 'bigint', unsigned: true })
  studentId: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  count: number;

  @Column({ type: 'simple-json', nullable: true })
  violations: string[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
