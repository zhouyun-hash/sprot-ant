import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('backup_record')
export class BackupRecord {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 32, default: 'full' })
  type: string;

  @Column({ name: 'file_url', type: 'varchar', length: 512, nullable: true })
  fileUrl: string | null;

  @Column({ name: 'file_size', type: 'bigint', unsigned: true, default: 0 })
  fileSize: number;

  @Column({ type: 'varchar', length: 32, default: 'completed' })
  status: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  operator: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
