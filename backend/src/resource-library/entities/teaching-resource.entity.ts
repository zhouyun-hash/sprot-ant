import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('teaching_resource')
export class TeachingResource {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 32 })
  type: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  category: string | null;

  @Column({ name: 'file_url', type: 'varchar', length: 512 })
  fileUrl: string;

  @Column({ name: 'file_size', type: 'bigint', unsigned: true, default: 0 })
  fileSize: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'uploader_id', type: 'bigint', unsigned: true, nullable: true })
  uploaderId: number | null;

  @Column({ name: 'download_count', type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
