import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Device } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DeviceService {
  constructor(@InjectRepository(Device) private deviceRepo: Repository<Device>) {}

  async findAll(query: { page?: number; size?: number; keyword?: string; status?: string; type?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    const [rows, total] = await this.deviceRepo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const device = await this.deviceRepo.findOneBy({ id });
    if (!device) throw new NotFoundException('设备不存在');
    return device;
  }

  async create(dto: CreateDeviceDto) {
    return this.deviceRepo.save(this.deviceRepo.create(dto));
  }

  async update(id: number, dto: UpdateDeviceDto) {
    await this.findOne(id);
    await this.deviceRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.deviceRepo.delete(id);
  }

  async restart(id: number) {
    const device = await this.findOne(id);
    await this.deviceRepo.update(id, { status: 'offline' });
    return { message: `设备 [${device.name}] 重启指令已下发`, deviceId: id };
  }
}
