import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TaskStatus = 'draft' | 'ongoing' | 'finished';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 32 })
  type: string;

  @Column({ name: 'grade_ids', type: 'simple-json' })
  gradeIds: number[];

  @Column({ name: 'class_ids', type: 'simple-json' })
  classIds: number[];

  @Column({ name: 'project_ids', type: 'simple-json' })
  projectIds: number[];

  @Column({ name: 'start_time', type: 'datetime', precision: 3 })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime', precision: 3 })
  endTime: Date;

  @Column({ length: 16, default: 'draft' })
  status: TaskStatus;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
