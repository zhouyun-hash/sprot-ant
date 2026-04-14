import * as crypto from 'crypto';

/**
 * 阿里云 POP RPC 签名与 POST body 构造（与 OpenAPI POP 协议一致，便于用 axios 发送）。
 * 参考：https://help.aliyun.com/document_detail/315526.html
 */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function rpcTimestamp(): string {
  const d = new Date();
  const YYYY = d.getUTCFullYear();
  const MM = pad2(d.getUTCMonth() + 1);
  const DD = pad2(d.getUTCDate());
  const HH = pad2(d.getUTCHours());
  const mm = pad2(d.getUTCMinutes());
  const ss = pad2(d.getUTCSeconds());
  return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}Z`;
}

export function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function firstLetterUpper(str: string): string {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

/** 将参数 key 转为首字母大写形式（与 @alicloud/pop-core 一致） */
export function formatParams(
  params: Record<string, string | number | undefined>,
): Record<string, string | number> {
  const next: Record<string, string | number> = {};
  for (const key of Object.keys(params)) {
    const v = params[key];
    if (v === undefined) {
      continue;
    }
    next[firstLetterUpper(key)] = v;
  }
  return next;
}

function flatParams(
  params: Record<string, string | number | string[] | undefined>,
): Record<string, string | number> {
  const target: Record<string, string | number> = {};
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        target[`${key}.${i + 1}`] = value[i];
      }
    } else {
      target[key] = value;
    }
  }
  return target;
}

function normalize(
  params: Record<string, string | number>,
): [string, string][] {
  const list: [string, string][] = [];
  const flated = flatParams(params);
  const keys = Object.keys(flated).sort();
  for (const key of keys) {
    const value = flated[key];
    list.push([percentEncode(key), percentEncode(String(value))]);
  }
  return list;
}

function canonicalize(normalized: [string, string][]): string {
  return normalized.map(([k, v]) => `${k}=${v}`).join('&');
}

export function signRpcPostBody(options: {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken?: string;
  apiVersion: string;
  action: string;
  /** 业务参数（小驼峰即可，会 formatParams） */
  businessParams: Record<string, string | number | undefined>;
}): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const merged: Record<string, string | number | undefined> = {
    Action: options.action,
    Format: 'JSON',
    Timestamp: rpcTimestamp(),
    Version: options.apiVersion,
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: nonce,
    AccessKeyId: options.accessKeyId,
    ...options.businessParams,
  };
  if (options.securityToken) {
    merged.SecurityToken = options.securityToken;
  }
  const formatted = formatParams(merged);
  const normalized = normalize(formatted as Record<string, string | number>);
  const canonicalized = canonicalize(normalized);
  const stringToSign = `POST&${percentEncode('/')}&${percentEncode(canonicalized)}`;
  const key = `${options.accessKeySecret}&`;
  const signature = crypto
    .createHmac('sha1', key)
    .update(stringToSign)
    .digest('base64');
  normalized.push([percentEncode('Signature'), percentEncode(signature)]);
  return canonicalize(normalized);
}
