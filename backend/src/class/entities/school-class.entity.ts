import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Grade } from '../../grade/entities/grade.entity';
import { School } from '../../school/entities/school.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';

@Entity('class')
export class SchoolClass {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ name: 'class_no', type: 'varchar', length: 32, nullable: true })
  classNo: string | null;

  @Column({ name: 'school_id', type: 'bigint', unsigned: true })
  schoolId: number;

  @ManyToOne(() => School, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'grade_id', type: 'bigint', unsigned: true })
  gradeId: number;

  @ManyToOne(() => Grade, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'grade_id' })
  gradeRef: Grade;

  @Column({ length: 32 })
  grade: string;

  @Column({ name: 'school_year', length: 32 })
  schoolYear: string;

  @Column({ name: 'teacher_id', type: 'bigint', unsigned: true, nullable: true })
  teacherId: number | null;

  @Column({
    name: 'head_teacher_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  headTeacherId: number | null;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'head_teacher_id' })
  headTeacher: Teacher | null;

  @Column({
    name: 'pe_teacher_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  peTeacherId: number | null;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pe_teacher_id' })
  peTeacher: Teacher | null;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher | null;

}
