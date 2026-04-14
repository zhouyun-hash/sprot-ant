import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SchoolClass } from '../../class/entities/school-class.entity';
import { User } from '../../user/entities/user.entity';

@Entity('student')
export class Student {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'class_id', type: 'bigint', unsigned: true })
  classId: number;

  @ManyToOne(() => SchoolClass, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'class_id' })
  schoolClass: SchoolClass;

  @Column({ name: 'student_no', length: 32 })
  studentNo: string;

  @Column({ name: 'parent_phone', type: 'varchar', length: 20, nullable: true })
  parentPhone: string | null;

  /** 身份证号（与家长端绑定校验、导入登记） */
  @Column({ name: 'id_card', type: 'varchar', length: 32, nullable: true })
  idCard: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  gender: number | null;
}
