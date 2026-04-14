import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('exam_standard')
export class ExamStandard {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'project_id' })
  projectId: number;

  @Column({ type: 'varchar', length: 32 })
  gender: string;

  @Column({ type: 'int', nullable: true, name: 'age_min' })
  ageMin: number | null;

  @Column({ type: 'int', nullable: true, name: 'age_max' })
  ageMax: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'grade_level' })
  gradeLevel: string | null;

  @Column({ type: 'json', nullable: true, name: 'score_rules' })
  scoreRules: Record<string, any> | null;

  @Column({ type: 'varchar', length: 32, default: 'v1' })
  version: string;

  @Column({ type: 'tinyint', default: 1 })
  enabled: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
