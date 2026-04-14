import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('message_record')
export class MessageRecord {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 32, default: 'notification' })
  type: string;

  @Column({ name: 'target_type', type: 'varchar', length: 32, default: 'all' })
  targetType: string;

  @Column({ name: 'target_ids', type: 'json', nullable: true })
  targetIds: any | null;

  @Column({ name: 'sender_id', type: 'bigint', unsigned: true, nullable: true })
  senderId: number | null;

  @Column({ type: 'varchar', length: 32, default: 'sent' })
  status: string;

  @Column({ name: 'read_count', type: 'int', default: 0 })
  readCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
