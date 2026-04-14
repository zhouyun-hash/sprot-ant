import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'user_id' })
  userId: number | null;

  @Column({ type: 'varchar', length: 64, default: '' })
  username: string;

  @Column({ type: 'varchar', length: 16 })
  action: string;

  @Column({ type: 'varchar', length: 512 })
  resource: string;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @Column({ type: 'varchar', length: 64, default: '' })
  ip: string;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ type: 'varchar', length: 16, default: 'success' })
  status: string;

  @Column({ type: 'varchar', length: 512, nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
