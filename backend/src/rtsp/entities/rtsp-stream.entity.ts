import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rtsp_stream')
export class RtspStream {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 512 })
  url: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'device_id' })
  deviceId: number | null;

  @Column({ type: 'varchar', length: 32, default: 'inactive' })
  status: string;

  @Column({ type: 'varchar', length: 16, default: 'rtsp' })
  protocol: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  resolution: string | null;

  @Column({ type: 'int', default: 25 })
  fps: number;

  @Column({ type: 'int', default: 0 })
  latency: number;

  @Column({ type: 'tinyint', default: 0 })
  encrypted: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
