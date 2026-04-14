import { getToken, clearAuth } from './auth'

function baseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
}

type Json = Record<string, unknown>

export function request<T = Json>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Json
  header?: Record<string, string>
}): Promise<T> {
  const { url, method = 'GET', data, header = {} } = options
  const token = getToken()
  if (token) {
    header.Authorization = `Bearer ${token}`
  }
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${baseUrl()}${url.startsWith('/') ? url : `/${url}`}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header,
      },
      success: (res) => {
        const status = res.statusCode || 0
        if (status === 401) {
          clearAuth()
          uni.reLaunch({ url: '/pages/common/login' })
          reject(new Error('未授权'))
          return
        }
        if (status >= 200 && status < 300) {
          resolve((res.data as T) ?? ({} as T))
          return
        }
        const body = res.data as Json | string | undefined
        let msg = `请求失败(${status})`
        if (body && typeof body === 'object' && 'message' in body) {
          const m = body.message
          msg = Array.isArray(m) ? m.join(', ') : String(m)
        }
        reject(new Error(msg))
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}
