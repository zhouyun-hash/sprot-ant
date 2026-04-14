import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('report')
export class Report {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'student_id', type: 'bigint', unsigned: true })
  studentId: number;

  @Column({ name: 'radar_data', type: 'simple-json' })
  radarData: Record<string, number>;

  @Column({ name: 'dimension_scores', type: 'simple-json' })
  dimensionScores: Record<string, number>;

  @Column({ type: 'text', nullable: true })
  suggestions: string | null;

  @CreateDateColumn({ name: 'generated_at', type: 'datetime', precision: 3 })
  generatedAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
