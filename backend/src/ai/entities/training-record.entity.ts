import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('training_record')
export class TrainingRecord {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  userId: number | null;

  @Column({ name: 'student_id', type: 'bigint', unsigned: true, nullable: true })
  studentId: number | null;

  @Column({ length: 32 })
  project: string;

  @Column({ name: 'result_json', type: 'simple-json', nullable: true })
  resultJson: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
