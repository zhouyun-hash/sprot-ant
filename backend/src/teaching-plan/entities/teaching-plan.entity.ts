import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('teaching_plan')
export class TeachingPlan {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'teacher_id', type: 'bigint', unsigned: true, nullable: true })
  teacherId: number | null;

  @Column({ name: 'grade_id', type: 'bigint', unsigned: true, nullable: true })
  gradeId: number | null;

  @Column({ name: 'school_year', type: 'varchar', length: 16 })
  schoolYear: string;

  @Column({ type: 'tinyint', default: 1 })
  semester: number;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ name: 'resource_ids', type: 'simple-json', nullable: true })
  resourceIds: number[] | null;

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
