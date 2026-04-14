import { IsIn, IsOptional, IsString } from 'class-validator';

export class AiGradeSubmissionDto {
  @IsOptional()
  @IsString()
  @IsIn(['action', 'skipping', 'situp'])
  scene?: 'action' | 'skipping' | 'situp';

  /** skipping/situp 场景建议传单帧 base64；不传则回退到 action 识别 */
  @IsOptional()
  @IsString()
  imageBase64?: string;

  /** skipping/situp 场景可选会话 ID，用于 AI 平台侧计数隔离 */
  @IsOptional()
  @IsString()
  sessionId?: string;
}
