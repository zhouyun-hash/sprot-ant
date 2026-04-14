import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from './entities/badge.entity';
import { BadgeAward } from './entities/badge-award.entity';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { AwardBadgeDto } from './dto/award-badge.dto';

@Injectable()
export class BadgeService {
  constructor(
    @InjectRepository(Badge) private badgeRepo: Repository<Badge>,
    @InjectRepository(BadgeAward) private awardRepo: Repository<BadgeAward>,
  ) {}

  async findAll() {
    return this.badgeRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateBadgeDto) {
    return this.badgeRepo.save(this.badgeRepo.create(dto));
  }

  async remove(id: number) {
    const row = await this.badgeRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('勋章不存在');
    await this.badgeRepo.delete(id);
  }

  async awardBadge(dto: AwardBadgeDto) {
    const badge = await this.badgeRepo.findOneBy({ id: dto.badgeId });
    if (!badge) throw new NotFoundException('勋章不存在');
    const award = this.awardRepo.create({
      badgeId: dto.badgeId,
      studentId: dto.studentId,
      awardedAt: new Date(),
    });
    return this.awardRepo.save(award);
  }

  async getStudentBadges(studentId: number) {
    return this.awardRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('badge', 'b', 'b.id = a.badge_id')
      .where('a.student_id = :studentId', { studentId })
      .select([
        'a.id AS id',
        'a.badge_id AS badgeId',
        'a.awarded_at AS awardedAt',
        'b.name AS badgeName',
        'b.icon AS badgeIcon',
        'b.description AS badgeDescription',
      ])
      .orderBy('a.awarded_at', 'DESC')
      .getRawMany();
  }
}
