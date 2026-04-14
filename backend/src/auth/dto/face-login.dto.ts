import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class FaceLoginDto {
  /** 图片 base64，可带 data:image/...;base64, 前缀 */
  @IsString()
  @IsNotEmpty()
  @MinLength(100, { message: 'imageBase64 过短' })
  imageBase64: string;
}
