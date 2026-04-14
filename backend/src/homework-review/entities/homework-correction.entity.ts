import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('homework_correction')
export class HomeworkCorrection {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'submission_id', type: 'bigint', unsigned: true })
  submissionId: number;

  @Column({ name: 'reviewer_id', type: 'bigint', unsigned: true, nullable: true })
  reviewerId: number | null;

  @Column({ name: 'ai_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  aiScore: number | null;

  @Column({ name: 'manual_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  manualScore: number | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'correction_type', type: 'varchar', length: 32 })
  correctionType: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
