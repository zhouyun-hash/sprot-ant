import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('score_review')
export class ScoreReview {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'score_id' })
  scoreId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'reviewer_id' })
  reviewerId: number | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'original_result' })
  originalResult: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'corrected_result' })
  correctedResult: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
