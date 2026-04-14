import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('alert')
export class Alert {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'class_id', type: 'bigint', unsigned: true, nullable: true })
  classId: number | null;

  @Column({ name: 'student_id', type: 'bigint', unsigned: true, nullable: true })
  studentId: number | null;

  @Column({ length: 64, default: 'ai_violation' })
  type: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'status', length: 16, default: 'open' })
  status: 'open' | 'resolved';

  @Column({ name: 'violation_count', type: 'int', unsigned: true, default: 0 })
  violationCount: number;

  @Column({ name: 'period_date', type: 'varchar', length: 16, nullable: true })
  periodDate: string | null;

  @Column({ name: 'resolved_at', type: 'datetime', precision: 3, nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
