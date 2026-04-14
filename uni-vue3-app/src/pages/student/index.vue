<template>
  <view class="page">
    <!-- 顶部：头像 + 姓名 -->
    <view class="header">
      <image
        v-if="avatarUrl"
        class="avatar"
        :src="avatarUrl"
        mode="aspectFill"
      />
      <view v-else class="avatar avatar-ph">{{ nameInitial }}</view>
      <view class="header-text">
        <text class="name">{{ displayName }}</text>
        <text v-if="studentNo" class="sub">学号 {{ studentNo }}</text>
      </view>
    </view>

    <!-- 关键指标 -->
    <view class="section-title">本周概览</view>
    <view class="metrics">
      <view class="metric-card">
        <text class="metric-val">{{ stats.totalMinutes }}</text>
        <text class="metric-unit">分钟</text>
        <text class="metric-label">运动总时长</text>
      </view>
      <view class="metric-card">
        <text class="metric-val">{{ stats.sessionCount }}</text>
        <text class="metric-unit">次</text>
        <text class="metric-label">训练次数</text>
      </view>
      <view class="metric-card">
        <text class="metric-val">{{ passRatePercent }}</text>
        <text class="metric-unit">%</text>
        <text class="metric-label">达标率</text>
      </view>
    </view>

    <!-- 快速入口 -->
    <view class="section-title">快速入口</view>
    <view class="quick-grid">
      <view
        v-for="item in quickItems"
        :key="item.key"
        class="quick-item"
        @click="onQuick(item.key)"
      >
        <view class="quick-icon">{{ item.icon }}</view>
        <text class="quick-label">{{ item.label }}</text>
      </view>
    </view>

    <!-- 最近训练 -->
    <view class="section-title">最近训练</view>
    <view v-if="recordsLoading" class="hint">加载中…</view>
    <view v-else-if="recentRecords.length === 0" class="hint">暂无训练记录</view>
    <view v-else class="record-list">
      <view v-for="r in recentRecords" :key="r.id" class="record-row">
        <view class="record-main">
          <text class="record-project">{{ r.project }}</text>
          <text class="record-time">{{ formatTime(r.createdAt) }}</text>
        </view>
        <text class="record-extra">{{ recordSummary(r) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'

const displayName = ref('同学')
const studentNo = ref('')
const avatarUrl = ref('')

const stats = ref({
  totalMinutes: 0,
  sessionCount: 0,
  passRate: 0,
})

const passRatePercent = computed(() =>
  Math.round((stats.value.passRate || 0) * 10000) / 100
)

const nameInitial = computed(() => {
  const n = displayName.value.trim()
  return n ? n.slice(0, 1) : '学'
})

const recordsLoading = ref(false)
const recentRecords = ref<
  Array<{
    id: number
    project: string
    createdAt: string
    resultJson: Record<string, unknown> | null
  }>
>([])

const studentId = ref<number | null>(null)

const quickItems = [
  { key: 'train', label: '自主训练', icon: '🏃' },
  { key: 'report', label: '成绩报告', icon: '📊' },
  { key: 'rank', label: '排行榜', icon: '🏆' },
  { key: 'homework', label: '体育作业', icon: '📚' },
  { key: 'sim', label: '中考模拟', icon: '📝' },
]

function onQuick(key: string) {
  if (key === 'train') {
    uni.navigateTo({ url: '/pages/student/training/index' })
    return
  }
  if (key === 'report') {
    uni.navigateTo({ url: '/pages/student/report/index' })
    return
  }
  if (key === 'rank') {
    uni.navigateTo({ url: '/pages/student/rank/index' })
    return
  }
  if (key === 'homework') {
    uni.navigateTo({ url: '/pages/student/homework/index' })
    return
  }
  if (key === 'sim') {
    uni.navigateTo({ url: '/pages/student/simulation/index' })
    return
  }
  const map: Record<string, string> = {}
  uni.showToast({
    title: `${map[key] || '功能'}开发中`,
    icon: 'none',
  })
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  const h = `${d.getHours()}`.padStart(2, '0')
  const min = `${d.getMinutes()}`.padStart(2, '0')
  return `${m}-${day} ${h}:${min}`
}

function recordSummary(r: {
  project: string
  resultJson: Record<string, unknown> | null
}) {
  const j = r.resultJson
  if (!j || typeof j !== 'object') return r.project
  const c = j.count ?? j.score ?? j.value
  if (typeof c === 'number' || typeof c === 'string') return `${r.project} · ${c}`
  return r.project
}

async function loadProfile() {
  if (!getToken()) return
  const data = await request<{
    studentNo?: string
    user?: { name?: string; avatar?: string | null }
  }>({
    url: '/students/me',
    method: 'GET',
  })
  studentId.value = typeof data.id === 'number' ? data.id : Number(data.id)
  studentNo.value = data.studentNo?.toString() || ''
  displayName.value = data.user?.name?.toString() || '同学'
  const av = data.user?.avatar
  if (av && typeof av === 'string' && av.length > 0) {
    const base = import.meta.env.VITE_API_BASE_URL || ''
    avatarUrl.value = av.startsWith('http') ? av : `${base.replace(/\/$/, '')}${av.startsWith('/') ? '' : '/'}${av}`
  }
}

async function loadStats() {
  if (!getToken()) return
  const data = await request<{
    totalMinutes: number
    sessionCount: number
    passRate: number
  }>({
    url: '/students/me/stats-week',
    method: 'GET',
  })
  stats.value = {
    totalMinutes: data.totalMinutes ?? 0,
    sessionCount: data.sessionCount ?? 0,
    passRate: data.passRate ?? 0,
  }
}

async function loadRecords() {
  if (!studentId.value) return
  recordsLoading.value = true
  try {
    const data = await request<{
      items: Array<{
        id: number
        project: string
        createdAt: string
        resultJson: Record<string, unknown> | null
      }>
    }>({
      url: `/students/${studentId.value}/training-records?page=1&pageSize=5`,
      method: 'GET',
    })
    recentRecords.value = data.items ?? []
  } catch {
    recentRecords.value = []
  } finally {
    recordsLoading.value = false
  }
}

/** 默认头像：无 static 资源时用占位 */
onMounted(async () => {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/common/login' })
    return
  }
  try {
    await loadProfile()
    await loadStats()
    await loadRecords()
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '加载失败',
      icon: 'none',
    })
  }
})
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 48rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #e8f4ff 0%, #f5f5f5 220rpx);
}

.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx 32rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #e5e5e5;
  flex-shrink: 0;
}

.avatar-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #1677ff, #69b1ff);
}

.header-text {
  margin-left: 28rpx;
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 40rpx;
  font-weight: 600;
  color: #111;
}

.sub {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #666;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin: 24rpx 8rpx 16rpx;
}

.metrics {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16rpx;
}

.metric-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.metric-val {
  font-size: 40rpx;
  font-weight: 700;
  color: #1677ff;
}

.metric-unit {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.metric-label {
  font-size: 22rpx;
  color: #666;
  margin-top: 12rpx;
}

.quick-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.quick-item {
  width: 22%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0;
}

.quick-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.quick-label {
  font-size: 22rpx;
  color: #333;
  text-align: center;
}

.hint {
  padding: 32rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}

.record-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.record-row {
  padding: 24rpx 28rpx;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
}

.record-row:last-child {
  border-bottom: none;
}

.record-main {
  display: flex;
  flex-direction: column;
}

.record-project {
  font-size: 30rpx;
  color: #111;
  font-weight: 500;
}

.record-time {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.record-extra {
  font-size: 24rpx;
  color: #666;
  max-width: 40%;
  text-align: right;
}
</style>
