<template>
  <view class="page">
    <view class="section">项目</view>
    <picker mode="selector" :range="projects" :value="projectIndex" @change="onProjectChange">
      <view class="picker-box">
        <text>{{ projects[projectIndex] }}</text>
        <text class="arrow">▼</text>
      </view>
    </picker>

    <view v-if="!canUseLiveCamera" class="warn">
      当前运行环境（如 H5）不支持 camera 组件实时预览，请在微信小程序或 App 中使用自主训练。
    </view>

    <view v-else class="cam-wrap">
      <camera
        v-show="showCamera"
        id="trainingCam"
        class="camera"
        device-position="front"
        flash="off"
        resolution="high"
        @error="onCameraError"
      />
    </view>

    <view class="btns">
      <button
        v-if="!running"
        class="btn primary"
        type="primary"
        :disabled="!canUseLiveCamera"
        @click="startTraining"
      >
        开始训练
      </button>
      <button v-else class="btn danger" type="warn" @click="stopTraining">结束训练</button>
    </view>

    <view class="section">实时结果（最近一帧）</view>
    <scroll-view scroll-y class="result-box">
      <text class="result-text">{{ resultDisplay }}</text>
    </scroll-view>

    <view class="meta">
      <text>已分析帧数：{{ frameCount }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { pathToBase64 } from '@/utils/imageBase64'
import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'

const projects = ['跳绳', '仰卧起坐', '立定跳远', '跑步'] as const
const projectIndex = ref(0)

const canUseLiveCamera = ref(true)
const showCamera = ref(false)
const running = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
let tickBusy = false

const lastResultJson = ref<Record<string, unknown> | null>(null)
const frameCount = ref(0)

const resultDisplay = computed(() => {
  if (!lastResultJson.value) return '等待分析…'
  try {
    return JSON.stringify(lastResultJson.value, null, 2)
  } catch {
    return String(lastResultJson.value)
  }
})

function onProjectChange(e: { detail: { value: string } }) {
  projectIndex.value = Number(e.detail.value)
}

function onCameraError(e: { detail?: { errMsg?: string } }) {
  uni.showToast({
    title: e.detail?.errMsg || '相机异常',
    icon: 'none',
  })
}

function checkPlatform() {
  try {
    const info = uni.getSystemInfoSync()
    canUseLiveCamera.value = info.uniPlatform !== 'web'
  } catch {
    canUseLiveCamera.value = true
  }
}

function takePhotoOnce(): Promise<string> {
  return new Promise((resolve, reject) => {
    const ctx = uni.createCameraContext('trainingCam')
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        if (res.tempImagePath) resolve(res.tempImagePath)
        else reject(new Error('无临时路径'))
      },
      fail: reject,
    })
  })
}

async function tick() {
  if (!running.value || tickBusy) return
  tickBusy = true
  try {
    const path = await takePhotoOnce()
    const imageBase64 = await pathToBase64(path)
    if (imageBase64.length < 100) return

    const project = projects[projectIndex.value]
    const data = await request<{
      result?: Record<string, unknown>
      trainingRecorded?: boolean
    }>({
      url: '/api/ai/self-training',
      method: 'POST',
      data: {
        project,
        imageBase64,
        persist: false,
      },
    })
    const r = data.result
    if (r && typeof r === 'object') {
      lastResultJson.value = r as Record<string, unknown>
    } else {
      lastResultJson.value = { raw: data as unknown as Record<string, unknown> }
    }
    frameCount.value += 1
  } catch (_) {
    /* 单帧失败可忽略，下一帧继续 */
  } finally {
    tickBusy = false
  }
}

function startTraining() {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/common/login' })
    return
  }
  if (!canUseLiveCamera.value) return
  lastResultJson.value = null
  frameCount.value = 0
  showCamera.value = true
  running.value = true
  setTimeout(() => {
    void tick()
    timer = setInterval(() => {
      void tick()
    }, 1000)
  }, 400)
}

function clearTimer() {
  if (timer != null) {
    clearInterval(timer)
    timer = null
  }
}

async function stopTraining() {
  clearTimer()
  running.value = false
  showCamera.value = false

  if (!lastResultJson.value || Object.keys(lastResultJson.value).length === 0) {
    uni.showToast({ title: '暂无有效结果可保存', icon: 'none' })
    return
  }

  try {
    await request({
      url: '/training-record',
      method: 'POST',
      data: {
        project: projects[projectIndex.value],
        resultJson: lastResultJson.value,
      },
    })
    uni.showToast({ title: '已保存训练记录', icon: 'success' })
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '保存失败',
      icon: 'none',
    })
  }
}

checkPlatform()

onUnmounted(() => {
  clearTimer()
})
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background: #f5f5f5;
}

.section {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.picker-box {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  font-size: 30rpx;
}

.arrow {
  font-size: 22rpx;
  color: #999;
}

.warn {
  padding: 20rpx;
  background: #fff7e6;
  color: #ad6800;
  font-size: 26rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.cam-wrap {
  width: 100%;
  height: 420rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #000;
  margin-bottom: 24rpx;
}

.camera {
  width: 100%;
  height: 100%;
}

.btns {
  margin-bottom: 24rpx;
}

.btn {
  width: 100%;
}

.result-box {
  max-height: 360rpx;
  padding: 20rpx;
  background: #fff;
  border-radius: 12rpx;
  border: 1px solid #eee;
}

.result-text {
  font-size: 22rpx;
  color: #333;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.meta {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #999;
}
</style>
