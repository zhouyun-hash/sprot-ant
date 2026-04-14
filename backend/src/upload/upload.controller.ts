import {
  BadRequestException,
  Controller,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterError } from 'multer';
import { OSSService } from './upload.service';

const UPLOAD_MAX_MB = Math.max(1, Number(process.env.UPLOAD_MAX_MB ?? 50));
const MAX_UPLOAD_SIZE = UPLOAD_MAX_MB * 1024 * 1024;
const ALLOWED_MIME_PREFIX = (process.env.UPLOAD_ALLOWED_MIME_PREFIX ?? 'image/,video/')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly ossService: OSSService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_SIZE },
      fileFilter: (_req, file, cb) => {
        const mime = (file.mimetype ?? '').toLowerCase();
        const ok = ALLOWED_MIME_PREFIX.some((p) => mime.startsWith(p));
        if (!mime || !ok) {
          return cb(
            new BadRequestException(
              `仅支持上传类型前缀为 ${ALLOWED_MIME_PREFIX.join(', ')} 的文件`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: { buffer: Buffer; originalname?: string } | undefined) {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('请上传文件字段 file');
    }
    try {
      const result = await this.ossService.uploadPublicFile(file);
      return {
        url: result.url,
        objectKey: result.objectKey,
      };
    } catch (e) {
      if (e instanceof MulterError && e.code === 'LIMIT_FILE_SIZE') {
        throw new PayloadTooLargeException(
          `文件大小不能超过 ${UPLOAD_MAX_MB}MB`,
        );
      }
      throw e;
    }
  }
}
