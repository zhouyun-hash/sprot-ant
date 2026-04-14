import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('sync_log')
export class SyncLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 64, default: 'education_bureau' })
  target: string;

  @Column({ length: 16, default: 'success' })
  status: 'success' | 'failed';

  @Column({ name: 'record_count', type: 'int', unsigned: true, default: 0 })
  recordCount: number;

  @Column({ name: 'request_body', type: 'longtext', nullable: true })
  requestBody: string | null;

  @Column({ name: 'response_body', type: 'longtext', nullable: true })
  responseBody: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
