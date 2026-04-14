<template>
  <view class="page">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="errorMsg" class="hint err">{{ errorMsg }}</view>
    <template v-else>
      <view class="section-title">训练记录</view>
      <view v-if="records.length === 0" class="hint">暂无训练记录</view>
      <view v-else class="list">
        <view v-for="r in records" :key="r.id" class="row card">
          <view class="row-main">
            <text class="title">{{ r.project }}</text>
            <text class="time">{{ formatTime(r.createdAt) }}</text>
          </view>
          <text class="extra">{{ recordSummary(r) }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'

const loading = ref(true)
const errorMsg = ref('')
const studentId = ref<number | null>(null)
const records = ref<
  Array<{
    id: number
    project: string
    createdAt: string
    resultJson: Record<string, unknown> | null
  }>
>([])

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

async function load() {
  if (!studentId.value) return
  const data = await request<{
    items: Array<{
      id: number
      project: string
      createdAt: string
      resultJson: Record<string, unknown> | null
    }>
  }>({
    url: `/students/${studentId.value}/training-records?page=1&pageSize=50`,
    method: 'GET',
  })
  records.value = data.items ?? []
}

onLoad((q) => {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/common/login' })
    return
  }
  const raw = q?.studentId
  const sid = raw ? Number(raw) : NaN
  if (!Number.isFinite(sid)) {
    errorMsg.value = '缺少学生参数'
    loading.value = false
    return
  }
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

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
}

.row-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.title {
  font-size: 30rpx;
  color: #111;
  font-weight: 500;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.extra {
  font-size: 24rpx;
  color: #666;
  max-width: 40%;
  text-align: right;
}
</style>
