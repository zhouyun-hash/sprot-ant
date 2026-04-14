import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'config_key', type: 'varchar', length: 128, unique: true })
  configKey: string;

  @Column({ name: 'config_value', type: 'text', nullable: true })
  configValue: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
