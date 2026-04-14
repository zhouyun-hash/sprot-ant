import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('badge')
export class Badge {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  icon: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  category: string | null;

  @Column({ name: 'condition_type', type: 'varchar', length: 64, nullable: true })
  conditionType: string | null;

  @Column({ name: 'condition_value', type: 'int', default: 0 })
  conditionValue: number;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
