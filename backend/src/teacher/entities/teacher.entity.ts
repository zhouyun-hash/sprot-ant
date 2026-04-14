import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { School } from '../../school/entities/school.entity';
import { User } from '../../user/entities/user.entity';

@Entity('teacher')
export class Teacher {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 所属学校（师资归属；与班级年级共同构成教学范围） */
  @Column({ name: 'school_id', type: 'bigint', unsigned: true, nullable: true })
  schoolId: number | null;

  @ManyToOne(() => School, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'teacher_no', length: 32 })
  teacherNo: string;

  @Column({ type: 'varchar', length: 64, default: '体育' })
  subject: string;
}
