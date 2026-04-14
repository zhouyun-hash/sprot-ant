import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, extname, join } from 'path';

@Injectable()
export class OSSService {
  private readonly logger = new Logger(OSSService.name);
  private readonly client: OSS | null;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly region: string;
  private readonly customPublicBaseUrl: string;
  private readonly dirPrefix: string;
  private readonly localMode: boolean;
  private readonly localUploadRoot: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('OSS_REGION', '');
    const accessKeyId = this.config.get<string>('OSS_ACCESS_KEY_ID', '');
    const accessKeySecret = this.config.get<string>('OSS_ACCESS_KEY_SECRET', '');
    this.bucket = this.config.get<string>('OSS_BUCKET', '');
    this.endpoint = this.config.get<string>('OSS_ENDPOINT', '');
    this.customPublicBaseUrl = this.config.get<string>('OSS_PUBLIC_BASE_URL', '');
    this.dirPrefix = this.config.get<string>('OSS_DIR_PREFIX', 'uploads').replace(/^\/+|\/+$/g, '');

    const port = this.config.get<string>('PORT', '3000');
    this.publicBaseUrl = this.config.get<string>('API_PUBLIC_BASE_URL', `http://127.0.0.1:${port}`);
    this.localUploadRoot = join(process.cwd(), 'uploads');

    this.localMode =
      !this.region || !accessKeyId || !accessKeySecret || !this.bucket;

    if (this.localMode) {
      this.client = null;
      this.logger.warn(
        'OSS 未完整配置，使用本地上传目录 uploads/（仅适合开发环境）',
      );
      return;
    }

    this.client = new OSS({
      region: this.region,
      accessKeyId,
      accessKeySecret,
      bucket: this.bucket,
      endpoint: this.endpoint || undefined,
      secure: true,
    });
  }

  async uploadPublicFile(file: { buffer: Buffer; originalname?: string }): Promise<{ url: string; objectKey: string }> {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('文件不能为空');
    }
    const ext = extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const objectKey = `${this.dirPrefix}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}${safeExt}`;

    if (this.localMode) {
      const absPath = join(this.localUploadRoot, objectKey);
      await mkdir(dirname(absPath), { recursive: true });
      await writeFile(absPath, file.buffer);
      const url = `${this.publicBaseUrl.replace(/\/+$/, '')}/${objectKey}`;
      return { objectKey, url };
    }

    try {
      await this.client!.put(objectKey, file.buffer, {
        headers: { 'x-oss-object-acl': 'public-read' },
      });
      return {
        objectKey,
        url: this.buildPublicUrl(objectKey),
      };
    } catch (e) {
      throw new InternalServerErrorException(`上传 OSS 失败: ${(e as Error).message}`);
    }
  }

  private buildPublicUrl(objectKey: string): string {
    if (this.customPublicBaseUrl) {
      return `${this.customPublicBaseUrl.replace(/\/+$/, '')}/${objectKey}`;
    }
    if (this.endpoint) {
      const base = this.endpoint.startsWith('http')
        ? this.endpoint
        : `https://${this.endpoint}`;
      return `${base.replace(/\/+$/, '')}/${objectKey}`;
    }
    return `https://${this.bucket}.oss-${this.region}.aliyuncs.com/${objectKey}`;
  }
}
