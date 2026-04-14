<template>
  <view class="page">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="errorMsg" class="hint err">{{ errorMsg }}</view>
    <template v-else>
      <view class="section-title">体测 · 各项目最好成绩</view>
      <view v-if="bestScores.length === 0" class="card empty">暂无体测成绩</view>
      <view v-else class="card list-card">
        <view v-for="row in bestScores" :key="row.id" class="data-row">
          <view class="data-main">
            <text class="data-title">{{ row.project }}</text>
            <text v-if="row.task?.name" class="data-sub">{{ row.task.name }}</text>
            <text class="data-time">{{ formatDate(row.createdAt) }}</text>
          </view>
          <view class="score-block">
            <text class="score-val">{{ row.result }}</text>
            <text class="score-unit">{{ row.unit }}</text>
          </view>
        </view>
      </view>

      <view class="section-title">自主训练记录</view>
      <view v-if="records.length === 0" class="card empty">暂无训练记录</view>
      <view v-else class="card list-card">
        <view v-for="r in records" :key="r.id" class="data-row">
          <view class="data-main">
            <text class="data-title">{{ r.project }}</text>
            <text class="data-time">{{ formatDateTime(r.createdAt) }}</text>
          </view>
          <text class="data-score">{{ trainingScoreText(r) }}</text>
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

type BestRow = {
  id: number
  project: string
  result: string
  unit: string
  createdAt: string
  task: { id: number; name: string } | null
}

const bestScores = ref<BestRow[]>([])

const records = ref<
  Array<{
    id: number
    project: string
    createdAt: string
    resultJson: Record<string, unknown> | null
  }>
>([])

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  const h = `${d.getHours()}`.padStart(2, '0')
  const min = `${d.getMinutes()}`.padStart(2, '0')
  return `${m}-${day} ${h}:${min}`
}

function trainingScoreText(r: {
  project: string
  resultJson: Record<string, unknown> | null
}) {
  const j = r.resultJson
  if (!j || typeof j !== 'object') return '—'
  const c = j.count ?? j.score ?? j.value ?? j.result
  if (typeof c === 'number' || typeof c === 'string') return String(c)
  const dm = j.duration_minutes ?? j.durationMinutes ?? j.minutes
  if (typeof dm === 'number' && Number.isFinite(dm)) return `${dm} 分钟`
  const ds = j.duration_seconds ?? j.durationSeconds
  if (typeof ds === 'number' && Number.isFinite(ds)) return `${ds} 秒`
  return '—'
}

async function loadAll() {
  if (!studentId.value) return
  const sid = studentId.value
  const [best, rec] = await Promise.all([
    request<{ items: BestRow[] }>({
      url: `/parent/students/${sid}/scores-best`,
      method: 'GET',
    }),
    request<{
      items: Array<{
        id: number
        project: string
        createdAt: string
        resultJson: Record<string, unknown> | null
      }>
    }>({
      url: `/students/${sid}/training-records?page=1&pageSize=100`,
      method: 'GET',
    }),
  ])
  bestScores.value = best.items ?? []
  records.value = rec.items ?? []
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
  loadAll()
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
  padding: 24rpx 24rpx 48rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #e8f4ff 0%, #f5f5f5 200rpx);
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
  margin: 8rpx 8rpx 16rpx;
}

.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 8rpx 0;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.card.empty {
  padding: 40rpx 28rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.list-card {
  padding: 0 28rpx 16rpx;
}

.data-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.data-row:last-child {
  border-bottom: none;
}

.data-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.data-title {
  font-size: 30rpx;
  color: #111;
  font-weight: 500;
}

.data-sub {
  font-size: 24rpx;
  color: #888;
}

.data-time {
  font-size: 22rpx;
  color: #bbb;
}

.score-block {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.score-val {
  font-size: 34rpx;
  font-weight: 700;
  color: #1677ff;
}

.score-unit {
  font-size: 22rpx;
  color: #888;
  margin-left: 6rpx;
}

.data-score {
  font-size: 28rpx;
  font-weight: 600;
  color: #1677ff;
  flex-shrink: 0;
  margin-left: 16rpx;
  max-width: 38%;
  text-align: right;
}
</style>
