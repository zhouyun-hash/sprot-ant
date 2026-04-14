import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AiSessionStatus = 'running' | 'ended';

@Entity('ai_session')
export class AiSession {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'session_id', length: 64, unique: true })
  sessionId: string;

  @Column({ name: 'task_id', type: 'bigint', unsigned: true })
  taskId: number;

  @Column({ name: 'class_id', type: 'bigint', unsigned: true })
  classId: number;

  @Column({ length: 64 })
  project: string;

  @Column({ length: 16, default: 'running' })
  status: AiSessionStatus;

  @Column({ name: 'ended_at', type: 'datetime', precision: 3, nullable: true })
  endedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
