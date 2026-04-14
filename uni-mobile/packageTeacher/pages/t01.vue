<template>
  <view class="page">
    <view class="card">
      <text class="title">教师登录</text>
      <text class="sub">使用 PC 管理后台同一套账号密码（教师 / 学校管理员等）</text>

      <view class="field">
        <text class="label">API 地址</text>
        <input
          v-model="apiBase"
          class="input"
          type="text"
          placeholder="默认本机 127.0.0.1:3000，真机填电脑 IP"
        />
      </view>

      <view class="field">
        <text class="label">用户名</text>
        <input v-model="username" class="input" type="text" placeholder="请输入用户名" />
      </view>

      <view class="field">
        <text class="label">密码</text>
        <input v-model="password" class="input" type="password" password placeholder="请输入密码" />
      </view>

      <button class="btn primary" :loading="loading" :disabled="loading" @click="onLogin">
        登录
      </button>

      <text class="tip">开发工具需勾选「不校验合法域名」；后端需已启动并可访问上述地址。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  getApiBase,
  setApiBase,
  setAuth,
  request,
  assertTeacherAppRole,
} from '../../utils/api'

const apiBase = ref(getApiBase())
const username = ref('')
const password = ref('')
const loading = ref(false)

async function onLogin() {
  const base = apiBase.value.trim().replace(/\/$/, '')
  if (!base) {
    uni.showToast({ title: '请填写 API 地址', icon: 'none' })
    return
  }
  setApiBase(base)

  const u = username.value.trim()
  const p = password.value
  if (!u || !p) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const data = await request<Record<string, unknown>>({
      url: '/auth/login',
      method: 'POST',
      data: { username: u, password: p },
    })
    const token =
      typeof data.access_token === 'string'
        ? data.access_token
        : typeof data.token === 'string'
          ? data.token
          : ''
    if (!token) {
      uni.showToast({ title: '登录失败：无 token', icon: 'none' })
      return
    }
    const user = (data.user as Record<string, unknown>) || {}
    const role = String(user.role || '')
    if (!assertTeacherAppRole(role)) {
      uni.showToast({ title: '请使用教师或管理员账号', icon: 'none' })
      return
    }
    setAuth(token, user)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/packageTeacher/pages/t02' })
    }, 400)
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '登录失败',
      icon: 'none',
      duration: 2500,
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48rpx 32rpx;
  box-sizing: border-box;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #111;
  margin-bottom: 12rpx;
}
.sub {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 40rpx;
  line-height: 1.5;
}
.field {
  margin-bottom: 28rpx;
}
.label {
  display: block;
  font-size: 26rpx;
  color: #333;
  margin-bottom: 12rpx;
}
.input {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  border: 1px solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.btn {
  margin-top: 24rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
}
.btn.primary {
  background: #1677ff;
  color: #fff;
}
.tip {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #999;
  line-height: 1.5;
}
</style>
