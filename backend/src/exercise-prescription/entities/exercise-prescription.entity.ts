import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('exercise_prescription')
export class ExercisePrescription {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'student_id' })
  studentId: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  category: string | null;

  @Column({ type: 'json', nullable: true })
  exercises: Record<string, any>[] | null;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  source: string | null;

  @Column({ type: 'int', default: 0, name: 'duration_days' })
  durationDays: number;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate: string | null;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
