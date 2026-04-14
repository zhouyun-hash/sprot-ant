import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('exam_plan')
export class ExamPlan {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 16, name: 'school_year' })
  schoolYear: string;

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status: string;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate: string | null;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: string | null;

  @Column({ type: 'json', nullable: true, name: 'project_ids' })
  projectIds: number[] | null;

  @Column({ type: 'json', nullable: true, name: 'grade_ids' })
  gradeIds: number[] | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
