import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('device')
export class Device {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  sn: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 32, default: 'offline' })
  status: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'firmware_version' })
  firmwareVersion: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'school_id' })
  schoolId: number | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  location: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'last_heartbeat' })
  lastHeartbeat: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
