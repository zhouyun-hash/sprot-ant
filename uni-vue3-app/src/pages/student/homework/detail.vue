<template>
  <view class="page">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="errorMsg" class="hint err">{{ errorMsg }}</view>
    <template v-else-if="hw">
      <view class="card block">
        <text class="h1">{{ hw.title }}</text>
        <text class="meta">截止 {{ formatDeadline(hw.deadline) }}</text>
        <text v-if="hw.description" class="desc">{{ hw.description }}</text>
      </view>

      <view v-if="readonly || hw.submission" class="card block">
        <view class="section-title">提交内容</view>
        <video
          v-if="hw.submission?.videoUrl"
          class="video"
          :src="resolveUrl(hw.submission.videoUrl)"
          controls
          :show-center-play-btn="true"
        />
        <text v-else class="hint-inline">暂无视频</text>
        <text v-if="hw.submission?.submittedAt" class="meta"
          >提交时间 {{ formatDeadline(hw.submission.submittedAt) }}</text
        >
        <text v-if="hw.submission?.teacherScore != null" class="meta"
          >教师评分 {{ hw.submission.teacherScore }}</text
        >
        <text v-if="hw.submission?.aiScore != null" class="meta"
          >AI 评分 {{ hw.submission.aiScore }}</text
        >
        <text v-if="hw.submission?.comment" class="desc">{{ hw.submission.comment }}</text>
      </view>

      <view v-if="!readonly && !hw.submission" class="card block">
        <view class="section-title">上传视频</view>
        <text class="tip">请录制或选择运动过程视频，上传成功后提交作业。</text>
        <button class="btn primary" :disabled="submitting" @click="chooseVideo">
          {{ localPath ? '重新选择视频' : '选择 / 录制视频' }}
        </button>
        <text v-if="localPath" class="file-hint">已选本地视频，点击下方提交上传</text>
        <button
          class="btn submit"
          :disabled="!localPath || submitting"
          @click="submitAll"
        >
          {{ submitting ? '上传并提交中…' : '上传并提交' }}
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'

type HomeworkDetail = {
  id: number
  title: string
  description: string | null
  deadline: string
  submission: {
    id: number
    status: string
    submittedAt: string
    videoUrl: string | null
    teacherScore?: number | null
    aiScore?: number | null
    comment?: string | null
  } | null
}

const loading = ref(true)
const errorMsg = ref('')
const hw = ref<HomeworkDetail | null>(null)
const homeworkId = ref(0)
const readonly = ref(false)

const localPath = ref('')
const submitting = ref(false)

function baseUrl() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
}

function formatDeadline(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  const h = `${d.getHours()}`.padStart(2, '0')
  const min = `${d.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function resolveUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const b = baseUrl().replace(/\/$/, '')
  return `${b}${url.startsWith('/') ? '' : '/'}${url}`
}

async function loadDetail() {
  const data = await request<HomeworkDetail>({
    url: `/homework/${homeworkId.value}`,
    method: 'GET',
  })
  hw.value = data
}

function chooseVideo() {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 300,
    compressed: true,
    success: (res) => {
      localPath.value = res.tempFilePath
    },
    fail: (e) => {
      if (e.errMsg && !e.errMsg.includes('cancel')) {
        uni.showToast({ title: e.errMsg || '选择失败', icon: 'none' })
      }
    },
  })
}

function uploadVideo(filePath: string): Promise<{ url: string }> {
  const token = getToken()
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseUrl().replace(/\/$/, '')}/upload`,
      filePath,
      name: 'file',
      header: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        const status = res.statusCode || 0
        if (status >= 200 && status < 300) {
          try {
            const data = JSON.parse(res.data as string) as { url: string }
            if (data.url) {
              resolve(data)
              return
            }
          } catch {
            /* fallthrough */
          }
          reject(new Error('上传响应无效'))
          return
        }
        reject(new Error(`上传失败(${status})`))
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}

async function submitAll() {
  if (!localPath.value || submitting.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    const { url } = await uploadVideo(localPath.value)
    await request({
      url: `/homework/${homeworkId.value}/submit`,
      method: 'POST',
      data: { videoUrl: url },
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    localPath.value = ''
    await loadDetail()
    readonly.value = true
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '提交失败',
      icon: 'none',
    })
  } finally {
    submitting.value = false
  }
}

onLoad((options: Record<string, string | undefined>) => {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/common/login' })
    return
  }
  const id = Number(options.id)
  if (!Number.isFinite(id) || id < 1) {
    errorMsg.value = '参数错误'
    loading.value = false
    return
  }
  homeworkId.value = id
  readonly.value = options.readonly === '1' || options.readonly === 'true'

  loading.value = true
  loadDetail()
    .then(() => {
      if (hw.value?.submission) {
        readonly.value = true
      }
    })
    .catch((e) => {
      errorMsg.value = e instanceof Error ? e.message : '加载失败'
    })
    .finally(() => {
      loading.value = false
    })
})
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #e8f4ff 0%, #f5f5f5 220rpx);
}

.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.block {
  margin-bottom: 24rpx;
}

.h1 {
  font-size: 34rpx;
  font-weight: 700;
  color: #111;
}

.meta {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #666;
}

.desc {
  display: block;
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #444;
  line-height: 1.5;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #111;
  margin-bottom: 16rpx;
}

.tip {
  display: block;
  font-size: 24rpx;
  color: #888;
  margin-bottom: 24rpx;
  line-height: 1.45;
}

.video {
  width: 100%;
  height: 400rpx;
  border-radius: 12rpx;
  background: #000;
  margin-bottom: 16rpx;
}

.hint-inline {
  font-size: 26rpx;
  color: #999;
}

.btn {
  margin-top: 16rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.btn.primary {
  background: #1677ff;
  color: #fff;
}

.btn.submit {
  background: linear-gradient(135deg, #1677ff, #69b1ff);
  color: #fff;
  margin-top: 24rpx;
}

.file-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #1677ff;
}

.hint {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999;
}

.hint.err {
  color: #cf1322;
}
</style>
