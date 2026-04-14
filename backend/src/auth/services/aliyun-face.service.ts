import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { signRpcPostBody } from '../utils/aliyun-rpc.util';

/** 阿里云 SearchFace 返回的 MatchList 单项（字段以官方文档为准） */
interface SearchFaceMatchItem {
  EntityId?: string;
  Score?: number;
  FaceId?: string;
}

interface SearchFaceData {
  MatchList?: SearchFaceMatchItem[];
}

interface AliyunRpcResponse<T = unknown> {
  RequestId?: string;
  Code?: string;
  Message?: string;
  Data?: T;
}

/**
 * 封装阿里云人脸识别（人脸库 + SearchFace）的 HTTP 调用，使用 axios 与 POP RPC 签名。
 * 人脸库需先在控制台或通过 CreateFaceDb / AddFace 录入，EntityId 建议与业务 user.id 字符串一致。
 */
@Injectable()
export class AliyunFaceService {
  private readonly logger = new Logger(AliyunFaceService.name);

  constructor(private readonly config: ConfigService) {}

  private get credentials() {
    const accessKeyId = this.config.get<string>('ALIYUN_ACCESS_KEY_ID', '');
    const accessKeySecret = this.config.get<string>('ALIYUN_ACCESS_KEY_SECRET', '');
    return { accessKeyId, accessKeySecret };
  }

  private get endpoint(): string {
    return this.config
      .get<string>('ALIYUN_FACE_ENDPOINT', 'https://facebody.cn-shanghai.aliyuncs.com')
      .replace(/\/+$/, '');
  }

  private get dbName(): string {
    return this.config.get<string>('ALIYUN_FACE_DB_NAME', 'default');
  }

  private get matchThreshold(): number {
    return parseFloat(
      this.config.get<string>('ALIYUN_FACE_MATCH_THRESHOLD', '0.6'),
    );
  }

  /**
   * 人脸搜索：将图片 base64（无 data URL 前缀）提交 SearchFace，返回置信度最高的一条 EntityId。
   */
  async searchFace(imageBase64: string): Promise<{ entityId: string; score: number } | null> {
    const { accessKeyId, accessKeySecret } = this.credentials;
    if (!accessKeyId || !accessKeySecret) {
      throw new BadRequestException('未配置 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET');
    }

    const limit = parseInt(
      this.config.get<string>('ALIYUN_FACE_SEARCH_LIMIT', '5'),
      10,
    );

    let body: string;
    try {
      body = signRpcPostBody({
        accessKeyId,
        accessKeySecret,
        apiVersion: '2019-12-30',
        action: 'SearchFace',
        businessParams: {
          dbName: this.dbName,
          imageBase64,
          limit,
        },
      });
    } catch (e) {
      this.logger.error(`RPC 签名失败: ${(e as Error).message}`);
      throw new BadRequestException('阿里云请求签名失败');
    }

    const url = `${this.endpoint}/`;
    try {
      const res = await axios.post<AliyunRpcResponse<SearchFaceData>>(url, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        timeout: 60000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: (s) => s === 200,
      });

      const data = res.data;
      if (data.Code && data.Message) {
        this.logger.warn(`SearchFace 业务错误: ${data.Code} ${data.Message}`);
        throw new BadRequestException(`阿里云人脸识别: ${data.Message ?? data.Code}`);
      }

      const list = data.Data?.MatchList ?? [];
      if (!list.length) {
        return null;
      }
      const sorted = [...list].sort(
        (a, b) => (b.Score ?? 0) - (a.Score ?? 0),
      );
      const best = sorted[0];
      const entityId = best.EntityId;
      const score = best.Score ?? 0;
      if (!entityId) {
        return null;
      }
      if (score < this.matchThreshold) {
        this.logger.debug(`人脸匹配分数 ${score} 低于阈值 ${this.matchThreshold}`);
        return null;
      }
      return { entityId, score };
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      if (axios.isAxiosError(e)) {
        const ax = e as AxiosError<AliyunRpcResponse>;
        const msg =
          ax.response?.data &&
          typeof ax.response.data === 'object' &&
          'Message' in ax.response.data
            ? String(
                (ax.response.data as AliyunRpcResponse).Message ??
                  ax.message,
              )
            : ax.message;
        this.logger.error(`SearchFace HTTP 失败: ${msg}`);
        throw new ServiceUnavailableException(`阿里云请求失败: ${msg}`);
      }
      throw e;
    }
  }

  /**
   * 向人脸库新增一张人脸（AddFace），EntityId 建议使用 String(user.id)。
   * 供管理端或脚本调用，非登录接口。
   */
  async addFace(entityId: string, imageBase64: string): Promise<void> {
    const { accessKeyId, accessKeySecret } = this.credentials;
    if (!accessKeyId || !accessKeySecret) {
      throw new BadRequestException('未配置 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET');
    }
    const body = signRpcPostBody({
      accessKeyId,
      accessKeySecret,
      apiVersion: '2019-12-30',
      action: 'AddFace',
      businessParams: {
        dbName: this.dbName,
        entityId,
        imageBase64,
      },
    });
    const url = `${this.endpoint}/`;
    try {
      const res = await axios.post<AliyunRpcResponse>(url, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 60000,
        maxBodyLength: Infinity,
        validateStatus: (s) => s === 200,
      });
      const data = res.data;
      if (data.Code && data.Code !== 'OK' && data.Message) {
        throw new BadRequestException(`AddFace: ${data.Message ?? data.Code}`);
      }
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      if (axios.isAxiosError(e)) {
        throw new ServiceUnavailableException(
          `AddFace 请求失败: ${e.message}`,
        );
      }
      throw e;
    }
  }
}
