import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('badge_award')
export class BadgeAward {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'badge_id', type: 'bigint', unsigned: true })
  badgeId: number;

  @Column({ name: 'student_id', type: 'bigint', unsigned: true })
  studentId: number;

  @Column({ name: 'awarded_at', type: 'datetime', precision: 3 })
  awardedAt: Date;
}
