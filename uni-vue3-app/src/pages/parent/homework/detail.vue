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

      <view v-if="hw.submission" class="card block">
        <view class="section-title">提交视频</view>
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
        <view v-if="hw.submission?.comment" class="comment-box">
          <text class="comment-label">教师批改评语</text>
          <text class="desc comment-text">{{ hw.submission.comment }}</text>
        </view>
      </view>

      <view v-else class="card block">
        <text class="tip">孩子尚未提交该作业。</text>
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
const studentId = ref(0)

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

async function load() {
  const data = await request<HomeworkDetail>({
    url: `/parent/students/${studentId.value}/homework/${homeworkId.value}`,
    method: 'GET',
  })
  hw.value = data
}

onLoad((q) => {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/common/login' })
    return
  }
  const id = q?.id ? Number(q.id) : NaN
  const sid = q?.studentId ? Number(q.studentId) : NaN
  if (!Number.isFinite(id) || !Number.isFinite(sid)) {
    errorMsg.value = '参数错误'
    loading.value = false
    return
  }
  homeworkId.value = id
  studentId.value = sid
  load()
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
  background: #f5f5f5;
}

.hint {
  padding: 48rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.hint.err {
  color: #cf1322;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.h1 {
  font-size: 34rpx;
  font-weight: 600;
  color: #111;
}

.meta {
  font-size: 24rpx;
  color: #888;
}

.desc {
  font-size: 28rpx;
  color: #444;
  line-height: 1.5;
  margin-top: 12rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.video {
  width: 100%;
  height: 360rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.hint-inline {
  font-size: 26rpx;
  color: #999;
}

.tip {
  font-size: 28rpx;
  color: #666;
}

.comment-box {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1px solid #f0f0f0;
}

.comment-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1677ff;
  margin-bottom: 12rpx;
}

.comment-text {
  margin-top: 0;
}
</style>
