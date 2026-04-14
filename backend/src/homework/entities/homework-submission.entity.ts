import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from '../../student/entities/student.entity';
import { Homework } from './homework.entity';

@Entity('homework_submission')
export class HomeworkSubmission {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'homework_id', type: 'bigint', unsigned: true })
  homeworkId: number;

  @ManyToOne(() => Homework, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homework_id' })
  homework: Homework;

  @Column({ name: 'student_id', type: 'bigint', unsigned: true })
  studentId: number;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ name: 'video_url', type: 'varchar', length: 1024, nullable: true })
  videoUrl: string | null;

  @Column({ length: 32, default: 'submitted' })
  status: string;

  @Column({ name: 'teacher_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  teacherScore: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  comment: string | null;

  @Column({ name: 'ai_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  aiScore: number | null;

  @CreateDateColumn({ name: 'submitted_at', type: 'datetime', precision: 3 })
  submittedAt: Date;
}
