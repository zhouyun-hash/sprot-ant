import { IsNotEmpty, IsString, IsUrl, Length } from 'class-validator';

export class SubmitHomeworkDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'videoUrl 必须是合法 URL' })
  @Length(1, 1024)
  videoUrl: string;
}
