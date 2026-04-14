import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('course_schedule')
export class CourseSchedule {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'class_id', type: 'bigint', unsigned: true })
  classId: number;

  @Column({ name: 'teacher_id', type: 'bigint', unsigned: true, nullable: true })
  teacherId: number | null;

  @Column({ type: 'varchar', length: 64, default: '体育' })
  subject: string;

  @Column({ name: 'day_of_week', type: 'tinyint' })
  dayOfWeek: number;

  @Column({ type: 'int' })
  period: number;

  @Column({ name: 'start_time', type: 'varchar', length: 8 })
  startTime: string;

  @Column({ name: 'end_time', type: 'varchar', length: 8 })
  endTime: string;

  @Column({ name: 'venue_id', type: 'bigint', unsigned: true, nullable: true })
  venueId: number | null;

  @Column({ name: 'school_year', type: 'varchar', length: 16 })
  schoolYear: string;

  @Column({ type: 'tinyint', default: 1 })
  semester: number;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;
}
