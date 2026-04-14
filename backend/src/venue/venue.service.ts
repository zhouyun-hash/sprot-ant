import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Venue } from './entities/venue.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Injectable()
export class VenueService {
  constructor(@InjectRepository(Venue) private venueRepo: Repository<Venue>) {}

  async findAll(query: { page?: number; size?: number; keyword?: string; status?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    if (query.status) where.status = query.status;
    const [rows, total] = await this.venueRepo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const venue = await this.venueRepo.findOneBy({ id });
    if (!venue) throw new NotFoundException('场地不存在');
    return venue;
  }

  async create(dto: CreateVenueDto) {
    return this.venueRepo.save(this.venueRepo.create(dto));
  }

  async update(id: number, dto: UpdateVenueDto) {
    await this.findOne(id);
    await this.venueRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.venueRepo.delete(id);
  }
}
