/**
 * 去掉 data URL 前缀，仅保留纯 base64 字符串供阿里云接口使用。
 */
export function stripBase64DataUrl(input: string): string {
  const trimmed = input.trim();
  const m = /^data:image\/[^;]+;base64,/.exec(trimmed);
  return m ? trimmed.slice(m[0].length) : trimmed;
}
