import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageRecord } from './entities/message-record.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageRecord) private msgRepo: Repository<MessageRecord>,
  ) {}

  async findAll(query: { page?: number; size?: number; type?: string; status?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    const [rows, total] = await this.msgRepo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async create(dto: CreateMessageDto) {
    return this.msgRepo.save(this.msgRepo.create(dto));
  }

  async remove(id: number) {
    const row = await this.msgRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('消息不存在');
    await this.msgRepo.delete(id);
  }
}
