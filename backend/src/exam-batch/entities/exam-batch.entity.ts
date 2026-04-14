import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('exam_batch')
export class ExamBatch {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'plan_id' })
  planId: number;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'date', nullable: true, name: 'batch_date' })
  batchDate: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: string;

  @Column({ type: 'json', nullable: true, name: 'class_ids' })
  classIds: number[] | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'venue_id' })
  venueId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
