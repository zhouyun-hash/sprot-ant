import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * 对应库表 user：登录账号与角色（与 PC / 移动端共用）。
 */
@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 64, unique: true })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 32, default: 'student' })
  role: string;

  @Column({ length: 64, default: '' })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatar: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
