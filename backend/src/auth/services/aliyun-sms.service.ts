import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { signRpcPostBody } from '../utils/aliyun-rpc.util';

interface AliyunSmsResponse {
  RequestId?: string;
  Code?: string;
  Message?: string;
  BizId?: string;
}

/**
 * 阿里云短信 SendSms（RPC），使用 axios 与 {@link signRpcPostBody}。
 * 控制台需配置签名、模板（模板变量与 TemplateParam JSON 一致，默认 code）。
 */
@Injectable()
export class AliyunSmsService {
  private readonly logger = new Logger(AliyunSmsService.name);

  constructor(private readonly config: ConfigService) {}

  private get credentials() {
    return {
      accessKeyId: this.config.get<string>('ALIYUN_ACCESS_KEY_ID', ''),
      accessKeySecret: this.config.get<string>('ALIYUN_ACCESS_KEY_SECRET', ''),
    };
  }

  private get endpoint(): string {
    return this.config
      .get<string>('ALIYUN_SMS_ENDPOINT', 'https://dysmsapi.aliyuncs.com')
      .replace(/\/+$/, '');
  }

  /**
   * 发送短信：模板参数 JSON 形如 {"code":"123456"}，与控制台模板变量对应。
   */
  async sendVerificationCode(phone: string, code: string): Promise<void> {
    const { accessKeyId, accessKeySecret } = this.credentials;
    if (!accessKeyId || !accessKeySecret) {
      throw new BadRequestException('未配置 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET');
    }
    const signName = this.config.get<string>('ALIYUN_SMS_SIGN_NAME', '');
    const templateCode = this.config.get<string>('ALIYUN_SMS_TEMPLATE_CODE', '');
    if (!signName || !templateCode) {
      throw new BadRequestException(
        '未配置 ALIYUN_SMS_SIGN_NAME 或 ALIYUN_SMS_TEMPLATE_CODE',
      );
    }

    const templateParam = JSON.stringify({ code });
    let body: string;
    try {
      body = signRpcPostBody({
        accessKeyId,
        accessKeySecret,
        apiVersion: '2017-05-25',
        action: 'SendSms',
        businessParams: {
          phoneNumbers: phone,
          signName,
          templateCode,
          templateParam,
        },
      });
    } catch (e) {
      this.logger.error(`SMS RPC 签名失败: ${(e as Error).message}`);
      throw new BadRequestException('短信请求签名失败');
    }

    const url = `${this.endpoint}/`;
    try {
      const res = await axios.post<AliyunSmsResponse>(url, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        timeout: 15000,
        validateStatus: (s) => s === 200,
      });
      const data = res.data;
      if (data.Code !== 'OK') {
        this.logger.warn(
          `SendSms 失败: ${data.Code} ${data.Message} RequestId=${data.RequestId}`,
        );
        throw new BadRequestException(
          data.Message ?? data.Code ?? '短信发送失败',
        );
      }
      this.logger.log(`SendSms OK BizId=${data.BizId} phone=${maskPhone(phone)}`);
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      if (axios.isAxiosError(e)) {
        const ax = e as AxiosError<AliyunSmsResponse>;
        const msg =
          ax.response?.data &&
          typeof ax.response.data === 'object' &&
          'Message' in ax.response.data
            ? String(
                (ax.response.data as AliyunSmsResponse).Message ?? ax.message,
              )
            : ax.message;
        this.logger.error(`SendSms HTTP 失败: ${msg}`);
        throw new ServiceUnavailableException(`短信服务请求失败: ${msg}`);
      }
      throw e;
    }
  }
}

function maskPhone(phone: string): string {
  if (phone.length < 7) {
    return '****';
  }
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
