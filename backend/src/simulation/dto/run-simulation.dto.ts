import { Type } from 'class-transformer';

import { IsIn, IsNotEmpty, IsNumber, Min } from 'class-validator';



export class RunSimulationDto {

  @IsNotEmpty()

  @IsIn(['rope', 'situp', 'long_jump', 'run_50', 'run_800', 'run_1000'])

  projectKey: string;



  @Type(() => Number)

  @IsNumber()

  @Min(0)

  inputValue: number;

}

