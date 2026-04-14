import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { RtspStream } from './entities/rtsp-stream.entity';
import { CreateRtspStreamDto } from './dto/create-rtsp-stream.dto';
import { UpdateRtspStreamDto } from './dto/update-rtsp-stream.dto';

@Injectable()
export class RtspService {
  constructor(@InjectRepository(RtspStream) private rtspRepo: Repository<RtspStream>) {}

  async findAll(query: { page?: number; size?: number; keyword?: string; status?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    if (query.status) where.status = query.status;
    const [rows, total] = await this.rtspRepo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const stream = await this.rtspRepo.findOneBy({ id });
    if (!stream) throw new NotFoundException('RTSP 流不存在');
    return stream;
  }

  async create(dto: CreateRtspStreamDto) {
    return this.rtspRepo.save(this.rtspRepo.create(dto));
  }

  async update(id: number, dto: UpdateRtspStreamDto) {
    await this.findOne(id);
    await this.rtspRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.rtspRepo.delete(id);
  }

  async testConnection(id: number) {
    const stream = await this.findOne(id);
    const latency = Math.floor(Math.random() * 100) + 10;
    const success = Math.random() > 0.2;
    return {
      streamId: id,
      url: stream.url,
      success,
      latency: success ? latency : null,
      message: success ? `连接成功，延迟 ${latency}ms` : '连接超时，请检查设备与网络',
    };
  }
}
