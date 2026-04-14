/**
 * 小程序请求封装。默认连本机后端；真机调试请在登录页修改「API 地址」为电脑局域网 IP。
 */
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const API_BASE_KEY = 'api_base_url'

/** 开发工具与本机后端同机时常用 */
const DEFAULT_BASE = 'http://127.0.0.1:3000'

export function getApiBase(): string {
  try {
    const saved = uni.getStorageSync(API_BASE_KEY)
    if (saved && typeof saved === 'string' && saved.trim()) {
      return saved.replace(/\/$/, '')
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_BASE
}

export function setApiBase(url: string) {
  const u = url.trim().replace(/\/$/, '')
  uni.setStorageSync(API_BASE_KEY, u)
}

export function getToken(): string {
  try {
    return uni.getStorageSync(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setAuth(token: string, user: Record<string, unknown>) {
  uni.setStorageSync(TOKEN_KEY, token)
  uni.setStorageSync(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  try {
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_KEY)
  } catch {
    /* ignore */
  }
}

export function getUser(): Record<string, unknown> | null {
  try {
    const raw = uni.getStorageSync(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

type Json = Record<string, unknown>

function parseErrorMessage(status: number, body: unknown): string {
  let msg = `请求失败(${status})`
  if (body && typeof body === 'object') {
    const m = (body as Json).message
    if (Array.isArray(m)) msg = m.join(', ')
    else if (m != null) msg = String(m)
  }
  return msg
}

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
  const base = getApiBase()
  const full = `${base}${url.startsWith('/') ? url : `/${url}`}`

  return new Promise((resolve, reject) => {
    uni.request({
      url: full,
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
          reject(new Error('未授权，请重新登录'))
          return
        }
        if (status >= 200 && status < 300) {
          resolve((res.data as T) ?? ({} as T))
          return
        }
        reject(new Error(parseErrorMessage(status, res.data)))
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}

/** 允许使用教师端管理后台类账号 */
const TEACHER_APP_ROLES = new Set([
  'teacher',
  'school_admin',
  'admin',
  'super_admin',
  'group_admin',
])

export function assertTeacherAppRole(role: string): boolean {
  return TEACHER_APP_ROLES.has((role || '').toLowerCase())
}
