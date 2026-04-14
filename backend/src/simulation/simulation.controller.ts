import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { QueryHistoryDto } from './dto/query-history.dto';

import { RunSimulationDto } from './dto/run-simulation.dto';

import { SimulationService } from './simulation.service';



@Controller('simulation')

@UseGuards(JwtAuthGuard)

export class SimulationController {

  constructor(private readonly simulationService: SimulationService) {}



  /** 可选项目列表（跳绳、仰卧起坐等） */

  @Get('projects')

  listProjects() {

    return this.simulationService.getProjectCatalog();

  }



  /** 当前学生在体测成绩中的历史最好（按项目） */

  @Get('history-best')

  getHistoryBest(

    @Query() query: QueryHistoryDto,

    @Req() req: Request & { user: { id: number; role: string } },

  ) {

    return this.simulationService.getHistoryBest(query.projectKey, req.user);

  }



  @Post()

  run(

    @Body() dto: RunSimulationDto,

    @Req() req: Request & { user: { id: number; role: string } },

  ) {

    return this.simulationService.run(dto, req.user);

  }

}

