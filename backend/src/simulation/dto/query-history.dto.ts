import { IsIn, IsNotEmpty } from 'class-validator';



export class QueryHistoryDto {

  @IsNotEmpty()

  @IsIn(['rope', 'situp', 'long_jump', 'run_50', 'run_800', 'run_1000'])

  projectKey: string;

}

