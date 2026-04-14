import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('app_version')
export class AppVersion {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 32 })
  platform: string;

  @Column({ type: 'varchar', length: 32 })
  version: string;

  @Column({ name: 'download_url', type: 'varchar', length: 512, nullable: true })
  downloadUrl: string | null;

  @Column({ name: 'force_update', type: 'tinyint', default: 0 })
  forceUpdate: number;

  @Column({ name: 'release_notes', type: 'text', nullable: true })
  releaseNotes: string | null;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
