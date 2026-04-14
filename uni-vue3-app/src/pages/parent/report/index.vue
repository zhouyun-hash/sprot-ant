<template>
  <view class="page">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="errorMsg" class="hint err">{{ errorMsg }}</view>
    <template v-else>
      <!-- 雷达图：echarts + uni-echarts（与学生端一致） -->
      <view class="card chart-card">
        <view class="section-title">五维能力雷达</view>
        <UniEcharts
          class="echart"
          :custom-style="chartBoxStyle"
          :option="chartOption"
          :autoresize="true"
        />
      </view>

      <view class="card">
        <view class="section-title">各维度评分</view>
        <view class="dim-list">
          <view v-for="d in dimensionOrder" :key="d" class="dim-row">
            <text class="dim-name">{{ d }}</text>
            <view class="dim-bar-wrap">
              <view
                class="dim-bar"
                :style="{ width: `${Math.min(100, Number(dimensionScores[d]) || 0)}%` }"
              />
            </view>
            <text class="dim-val">{{ formatScore(dimensionScores[d]) }}</text>
          </view>
        </view>
        <view class="suggest-box">
          <text class="suggest-label">建议</text>
          <text class="suggest-text">{{ suggestionText }}</text>
        </view>
        <text v-if="reportMeta.generatedAt" class="meta"
          >报告生成时间：{{ formatDate(reportMeta.generatedAt) }}</text
        >
      </view>

      <view class="card tabs-card">
        <view class="tabs">
          <view
            :class="['tab', activeTab === 'scores' && 'tab-active']"
            @click="switchTab('scores')"
            >体测成绩</view
          >
          <view
            :class="['tab', activeTab === 'reports' && 'tab-active']"
            @click="switchTab('reports')"
            >报告记录</view
          >
        </view>

        <view v-if="listLoading" class="hint">加载中…</view>
        <view v-else-if="activeTab === 'scores'">
          <view v-if="scoreItems.length === 0" class="hint">暂无体测成绩</view>
          <view v-else class="data-list">
            <view v-for="row in scoreItems" :key="row.id" class="data-row">
              <view class="data-main">
                <text class="data-title">{{ row.project }}</text>
                <text class="data-sub">{{ row.task?.name || '体测任务' }}</text>
                <text class="data-time">{{ formatDate(row.createdAt) }}</text>
              </view>
              <text class="data-score">{{ row.result }}{{ row.unit }}</text>
            </view>
          </view>
        </view>
        <view v-else>
          <view v-if="reportItems.length === 0" class="hint">暂无历史报告</view>
          <view v-else class="data-list">
            <view v-for="r in reportItems" :key="r.id" class="data-row">
              <view class="data-main">
                <text class="data-title">综合报告 #{{ r.id }}</text>
                <text class="data-time">{{ formatDate(r.generatedAt) }}</text>
              </view>
              <text class="data-mini">{{ summarizeDimensions(r.dimensionScores) }}</text>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as echarts from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import {
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { provideEcharts } from 'uni-echarts/shared'
import UniEcharts from 'uni-echarts'
import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'

echarts.use([
  CanvasRenderer,
  RadarChart,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])
provideEcharts(echarts)

const dimensionOrder = ['力量', '速度', '耐力', '柔韧', '协调'] as const

type ReportPayload = {
  id?: number
  studentId?: number
  radarData: Record<string, number>
  dimensionScores: Record<string, number>
  suggestions: string
  generatedAt?: string
}

const loading = ref(true)
const errorMsg = ref('')
const studentId = ref<number | null>(null)

const reportMeta = ref<Partial<ReportPayload>>({})
const dimensionScores = ref<Record<string, number>>({})
const suggestionText = ref('')

const chartBoxStyle = 'width:100%;height:480rpx;'

const chartOption = computed(() => {
  const radar = reportMeta.value.radarData || dimensionScores.value
  const values = dimensionOrder.map((k) => {
    const v = Number(radar[k])
    return Number.isFinite(v) ? v : 0
  })
  const maxVal = Math.max(100, ...values, 1)
  return {
    color: ['#1677ff'],
    tooltip: {},
    radar: {
      indicator: dimensionOrder.map((name) => ({ name, max: maxVal })),
      radius: '62%',
      splitNumber: 4,
      axisName: {
        color: '#666',
        fontSize: 11,
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '能力值',
            areaStyle: { opacity: 0.22 },
            lineStyle: { width: 2 },
          },
        ],
      },
    ],
  }
})

const activeTab = ref<'scores' | 'reports'>('scores')
const listLoading = ref(false)
const scoreItems = ref<
  Array<{
    id: number
    project: string
    result: string
    unit: string
    createdAt: string
    task: { id: number; name: string; type?: string; status?: string } | null
  }>
>([])
const reportItems = ref<ReportPayload[]>([])

function formatScore(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(1)
}

function formatDate(iso: string | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  const h = `${d.getHours()}`.padStart(2, '0')
  const min = `${d.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function summarizeDimensions(ds: Record<string, number> | undefined) {
  if (!ds) return ''
  return dimensionOrder.map((k) => `${k}${formatScore(ds[k])}`).join(' · ')
}

async function loadReport() {
  if (!studentId.value) return
  const data = await request<ReportPayload>({
    url: `/parent/students/${studentId.value}/report`,
    method: 'GET',
  })
  reportMeta.value = data
  dimensionScores.value = data.dimensionScores || data.radarData || {}
  suggestionText.value =
    typeof data.suggestions === 'string' && data.suggestions.length > 0
      ? data.suggestions
      : '暂无文字建议。'
}

async function loadScores() {
  if (!studentId.value) return
  listLoading.value = true
  try {
    const data = await request<{
      items: typeof scoreItems.value
      total: number
    }>({
      url: `/parent/students/${studentId.value}/scores?page=1&pageSize=50`,
      method: 'GET',
    })
    scoreItems.value = data.items ?? []
  } catch {
    scoreItems.value = []
  } finally {
    listLoading.value = false
  }
}

async function loadReportHistory() {
  if (!studentId.value) return
  listLoading.value = true
  try {
    const data = await request<{ items: ReportPayload[] }>({
      url: `/parent/students/${studentId.value}/report/history?page=1&pageSize=50`,
      method: 'GET',
    })
    reportItems.value = data.items ?? []
  } catch {
    reportItems.value = []
  } finally {
    listLoading.value = false
  }
}

function switchTab(tab: 'scores' | 'reports') {
  if (activeTab.value === tab) return
  activeTab.value = tab
  if (tab === 'scores' && scoreItems.value.length === 0) loadScores()
  if (tab === 'reports' && reportItems.value.length === 0) loadReportHistory()
}

onLoad(async (q) => {
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
  try {
    await loadReport()
    await loadScores()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
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
  border-radius: 20rpx;
  padding: 24rpx 28rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.chart-card {
  padding-bottom: 8rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111;
  margin-bottom: 16rpx;
}

.echart {
  width: 100%;
}

.dim-list {
  margin-top: 8rpx;
}

.dim-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 20rpx;
}

.dim-name {
  width: 96rpx;
  font-size: 26rpx;
  color: #333;
  flex-shrink: 0;
}

.dim-bar-wrap {
  flex: 1;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
  margin: 0 16rpx;
}

.dim-bar {
  height: 100%;
  background: linear-gradient(90deg, #69b1ff, #1677ff);
  border-radius: 8rpx;
}

.dim-val {
  width: 72rpx;
  text-align: right;
  font-size: 26rpx;
  font-weight: 600;
  color: #1677ff;
}

.suggest-box {
  margin-top: 28rpx;
  padding: 20rpx;
  background: #f6faff;
  border-radius: 12rpx;
  border-left: 6rpx solid #1677ff;
}

.suggest-label {
  display: block;
  font-size: 24rpx;
  color: #1677ff;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.suggest-text {
  font-size: 26rpx;
  color: #444;
  line-height: 1.55;
}

.meta {
  display: block;
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #999;
}

.tabs-card {
  padding-top: 16rpx;
}

.tabs {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #eee;
  margin: 0 -8rpx 20rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-active {
  color: #1677ff;
  font-weight: 600;
}

.tab-active::after {
  content: '';
  position: absolute;
  left: 25%;
  right: 25%;
  bottom: 0;
  height: 4rpx;
  background: #1677ff;
  border-radius: 2rpx;
}

.data-list {
  max-height: none;
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
}

.data-title {
  font-size: 28rpx;
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

.data-score {
  font-size: 30rpx;
  font-weight: 700;
  color: #1677ff;
  margin-left: 16rpx;
}

.data-mini {
  font-size: 22rpx;
  color: #666;
  max-width: 42%;
  text-align: right;
  line-height: 1.4;
}
</style>
