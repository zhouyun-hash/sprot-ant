const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export function setAuth(token: string, user: Record<string, unknown>) {
  uni.setStorageSync(TOKEN_KEY, token)
  uni.setStorageSync(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(USER_KEY)
}

export function getToken(): string {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function getUser(): Record<string, unknown> | null {
  const raw = uni.getStorageSync(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

/** 根据后端 user.role 跳转首页 */
export function reLaunchHomeByRole(role: string) {
  const r = (role || '').toLowerCase()
  if (r === 'student') {
    uni.reLaunch({ url: '/pages/student/index' })
    return
  }
  if (r === 'parent') {
    uni.reLaunch({ url: '/pages/parent/index' })
    return
  }
  uni.showToast({
    title: '请使用学生或家长账号',
    icon: 'none',
  })
}
