import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ai_model')
export class AiModel {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'varchar', length: 512, nullable: true, name: 'file_url' })
  fileUrl: string | null;

  @Column({ type: 'varchar', length: 32 })
  version: string;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
