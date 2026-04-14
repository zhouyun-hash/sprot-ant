<template>
  <view class="page">
    <view class="card">
      <text class="title">智慧体育</text>
      <text class="sub">学号密码或人脸登录</text>

      <input
        v-model="username"
        class="input"
        type="text"
        placeholder="学号 / 用户名"
      />
      <input
        v-model="password"
        class="input"
        type="password"
        password
        placeholder="密码"
      />

      <button
        class="btn primary"
        :loading="loadingPwd"
        :disabled="loadingPwd || loadingFace"
        @click="loginWithPassword"
      >
        学号密码登录
      </button>

      <button
        class="btn outline"
        :loading="loadingFace"
        :disabled="loadingPwd || loadingFace"
        @click="onFaceLoginTap"
      >
        人脸登录
      </button>
    </view>

    <!-- 实时取景：camera + createCameraContext.takePhoto（小程序/App 等） -->
    <view v-if="showCameraLayer" class="camera-mask" @touchmove.stop.prevent>
      <camera
        id="faceCamera"
        class="camera-el"
        device-position="front"
        flash="off"
        resolution="high"
        @error="onCameraError"
      />
      <view class="camera-bar">
        <button class="cam-btn" @click="closeCameraLayer">取消</button>
        <button class="cam-btn primary" :loading="loadingFace" @click="takePhotoWithCameraContext">
          拍照识别
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { request } from '@/utils/request'
import { setAuth, reLaunchHomeByRole } from '@/utils/auth'

const username = ref('')
const password = ref('')
const loadingPwd = ref(false)
const loadingFace = ref(false)
const showCameraLayer = ref(false)

function tokenFromBody(data: Record<string, unknown>): string {
  const t = data.access_token ?? data.token
  return typeof t === 'string' ? t : ''
}

function afterLogin(data: Record<string, unknown>) {
  const token = tokenFromBody(data)
  if (!token) {
    uni.showToast({ title: '登录失败：无 token', icon: 'none' })
    return
  }
  const user = (data.user as Record<string, unknown>) || {}
  setAuth(token, user)
  const role = String(user.role || '')
  reLaunchHomeByRole(role)
}

async function loginWithPassword() {
  const u = username.value.trim()
  const p = password.value
  if (!u || !p) {
    uni.showToast({ title: '请输入学号与密码', icon: 'none' })
    return
  }
  loadingPwd.value = true
  try {
    const data = await request<Record<string, unknown>>({
      url: '/auth/login',
      method: 'POST',
      data: { username: u, password: p },
    })
    afterLogin(data)
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '登录失败',
      icon: 'none',
    })
  } finally {
    loadingPwd.value = false
  }
}

/** 将本地临时路径转为纯 base64（不含 data: 前缀） */
function pathToBase64(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager?.()
    if (fs?.readFile) {
      fs.readFile({
        filePath: path,
        encoding: 'base64',
        success: (r) => resolve(String(r.data || '')),
        fail: (err) => reject(err),
      })
      return
    }
    if (typeof fetch !== 'undefined') {
      fetch(path)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise<string>((res2, rej2) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                const dataUrl = reader.result as string
                const i = dataUrl.indexOf(',')
                res2(i >= 0 ? dataUrl.slice(i + 1) : dataUrl)
              }
              reader.onerror = () => rej2(new Error('读取图片失败'))
              reader.readAsDataURL(blob)
            })
        )
        .then(resolve)
        .catch(reject)
      return
    }
    reject(new Error('当前环境无法读取图片文件'))
  })
}

/** POST /auth/face-login，成功后按角色跳转 */
async function submitFaceBase64(imageBase64: string) {
  if (imageBase64.length < 100) {
    throw new Error('图片数据过短，请重试')
  }
  const data = await request<Record<string, unknown>>({
    url: '/auth/face-login',
    method: 'POST',
    data: { imageBase64 },
  })
  afterLogin(data)
}

function toastErr(e: unknown) {
  const msg =
    e && typeof e === 'object' && 'errMsg' in e
      ? String((e as { errMsg: string }).errMsg)
      : e instanceof Error
        ? e.message
        : '人脸登录失败'
  if (!String(msg).includes('cancel') && !String(msg).includes('取消')) {
    uni.showToast({ title: msg, icon: 'none' })
  }
}

/** uni.chooseImage：相机或相册 */
async function pickImageWithChooseImage(sourceType: ('album' | 'camera')[]) {
  const choose = await new Promise<{ tempFilePaths: string[] }>((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType,
      success: resolve,
      fail: reject,
    })
  })
  const path = choose.tempFilePaths[0]
  if (!path) throw new Error('未选择图片')
  const imageBase64 = await pathToBase64(path)
  await submitFaceBase64(imageBase64)
}

/** 点击「人脸登录」：选择采集方式 */
function onFaceLoginTap() {
  uni.showActionSheet({
    itemList: ['拍照（系统相机）', '从相册选择', '实时取景拍照'],
    success: async (res) => {
      const idx = res.tapIndex
      loadingFace.value = true
      try {
        if (idx === 0) {
          await pickImageWithChooseImage(['camera'])
        } else if (idx === 1) {
          await pickImageWithChooseImage(['album'])
        } else {
          await openLiveCameraFlow()
        }
      } catch (e) {
        toastErr(e)
      } finally {
        loadingFace.value = false
      }
    },
    fail: () => {},
  })
}

/** H5 无 camera 组件能力时用相册/系统相机代替 */
function openLiveCameraFlow() {
  return new Promise<void>((resolve, reject) => {
    // #ifdef H5
    uni.showModal({
      title: '提示',
      content: '当前端不支持实时取景组件，将使用系统相机拍照',
      success: async (m) => {
        if (!m.confirm) {
          resolve()
          return
        }
        try {
          await pickImageWithChooseImage(['camera'])
          resolve()
        } catch (e) {
          reject(e)
        }
      },
    })
    // #endif
    // #ifndef H5
    showCameraLayer.value = true
    resolve()
    // #endif
  })
}

function closeCameraLayer() {
  showCameraLayer.value = false
}

function onCameraError(e: { detail?: { errMsg?: string } }) {
  uni.showToast({
    title: e?.detail?.errMsg || '相机打开失败',
    icon: 'none',
  })
  showCameraLayer.value = false
}

/** uni.createCameraContext + takePhoto，再转 base64 登录 */
function takePhotoWithCameraContext() {
  loadingFace.value = true
  const ctx = uni.createCameraContext('faceCamera')
  ctx.takePhoto({
    quality: 'high',
    success: async (res) => {
      const path = res.tempImagePath
      if (!path) {
        loadingFace.value = false
        uni.showToast({ title: '未生成照片', icon: 'none' })
        return
      }
      try {
        const imageBase64 = await pathToBase64(path)
        showCameraLayer.value = false
        await submitFaceBase64(imageBase64)
      } catch (e) {
        toastErr(e)
      } finally {
        loadingFace.value = false
      }
    },
    fail: (err) => {
      loadingFace.value = false
      toastErr(err)
    },
  })
}
</script>

<style scoped lang="scss">
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
}

.input {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
  border: 1px solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.btn {
  margin-top: 16rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.btn.primary {
  background: #1677ff;
  color: #fff;
}

.btn.outline {
  background: #fff;
  color: #1677ff;
  border: 1px solid #1677ff;
}

.camera-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 999;
  background: #000;
  display: flex;
  flex-direction: column;
}

.camera-el {
  flex: 1;
  width: 100%;
}

.camera-bar {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.85);
}

.cam-btn {
  flex: 1;
  margin: 0 12rpx;
  color: #fff;
  background: #333;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.cam-btn.primary {
  background: #1677ff;
}
</style>
