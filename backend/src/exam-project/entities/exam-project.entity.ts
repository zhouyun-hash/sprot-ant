import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ExamProjectScoreType } from '../constants/exam-project-score-type';

@Entity('exam_project')
export class ExamProject {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  unit: string | null;

  @Column({ type: 'varchar', length: 32, default: ExamProjectScoreType.Count })
  scoreType: ExamProjectScoreType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'json', nullable: true })
  params: Record<string, any> | null;

  @Column({ type: 'tinyint', default: 1 })
  enabled: number;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
