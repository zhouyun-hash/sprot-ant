import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('venue')
export class Venue {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  type: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  location: string | null;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ type: 'varchar', length: 32, default: 'available' })
  status: string;

  @Column({ type: 'text', nullable: true })
  facilities: string | null;

  @Column({ type: 'text', nullable: true })
  rules: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'school_id' })
  schoolId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
