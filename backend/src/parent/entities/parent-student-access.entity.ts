import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ParentAccessStatus = 'pending' | 'approved' | 'rejected';

@Entity('parent_student_access')
@Index(['parentUserId', 'studentId'], { unique: true })
export class ParentStudentAccess {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'parent_user_id', type: 'bigint', unsigned: true })
  parentUserId: number;

  @Column({ name: 'student_id', type: 'bigint', unsigned: true })
  studentId: number;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: ParentAccessStatus;

  @Column({ name: 'reviewed_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  reviewedByUserId: number | null;

  @Column({ name: 'reviewed_at', type: 'datetime', precision: 3, nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
