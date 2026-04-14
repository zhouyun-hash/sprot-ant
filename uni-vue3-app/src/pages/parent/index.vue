<template>
  <view class="page">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="errorMsg" class="hint err">{{ errorMsg }}</view>
    <template v-else>
      <!-- 顶部：切换孩子 -->
      <view class="header" @click="onTapHeader">
        <image
          v-if="avatarUrl"
          class="avatar"
          :src="avatarUrl"
          mode="aspectFill"
        />
        <view v-else class="avatar avatar-ph">{{ nameInitial }}</view>
        <view class="header-text">
          <text class="name">{{ displayName }}</text>
          <text v-if="classLine" class="sub">{{ classLine }}</text>
        </view>
        <text v-if="children.length > 1" class="switch-hint">切换 ›</text>
      </view>

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

      <view class="section-title">近 7 天运动趋势</view>
      <view class="card chart-card">
        <UniEcharts
          class="echart"
          :custom-style="chartBoxStyle"
          :option="chartOption"
          :autoresize="true"
        />
      </view>

      <view class="section-title">快捷入口</view>
      <view class="btn-row">
        <button class="btn primary" @click="goChildData">查看详细数据</button>
        <button class="btn primary" @click="goReport">体质报告</button>
        <button class="btn primary" @click="goHomework">作业</button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { provideEcharts } from 'uni-echarts/shared'
import UniEcharts from 'uni-echarts'
import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'

echarts.use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])
provideEcharts(echarts)

const STORAGE_KEY = 'parent_selected_student_id'

type ChildItem = {
  id: number
  studentNo?: string
  className?: string | null
  grade?: string | null
  user?: { id: number; name?: string; avatar?: string | null } | null
}

const loading = ref(true)
const errorMsg = ref('')
const children = ref<ChildItem[]>([])
const currentId = ref<number | null>(null)

const stats = ref({
  totalMinutes: 0,
  sessionCount: 0,
  passRate: 0,
})

const trend = ref<{ labels: string[]; values: number[] }>({
  labels: [],
  values: [],
})

const passRatePercent = computed(() =>
  Math.round((stats.value.passRate || 0) * 10000) / 100
)

const currentChild = computed(() =>
  children.value.find((c) => c.id === currentId.value) ?? null
)

const displayName = computed(
  () => currentChild.value?.user?.name?.trim() || '孩子'
)

const classLine = computed(() => {
  const c = currentChild.value
  if (!c) return ''
  const g = c.grade ? `${c.grade} · ` : ''
  const cn = c.className || ''
  return cn ? `${g}${cn}` : g.replace(/ · $/, '')
})

const nameInitial = computed(() => {
  const n = displayName.value.trim()
  return n ? n.slice(0, 1) : '孩'
})

const avatarUrl = computed(() => {
  const av = currentChild.value?.user?.avatar
  if (!av || typeof av !== 'string' || av.length === 0) return ''
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return av.startsWith('http')
    ? av
    : `${base.replace(/\/$/, '')}${av.startsWith('/') ? '' : '/'}${av}`
})

const chartBoxStyle = 'width:100%;height:480rpx;'

const chartOption = computed(() => {

  const labels = trend.value.labels || []

  const values = trend.value.values || []

  return {

    color: ['#1677ff'],

    tooltip: { trigger: 'axis' },

    grid: {

      left: '12%',

      right: '8%',

      bottom: '14%',

      top: '14%',

    },

    xAxis: {

      type: 'category',

      data: labels,

      boundaryGap: false,

      axisLabel: { color: '#666', fontSize: 11 },

    },

    yAxis: {

      type: 'value',

      name: '分钟',

      nameTextStyle: { color: '#999', fontSize: 11 },

      axisLabel: { color: '#666', fontSize: 11 },

      splitLine: { lineStyle: { color: '#eee' } },

    },

    series: [

      {

        type: 'line',

        data: values,

        smooth: true,

        showSymbol: true,

        areaStyle: { opacity: 0.12 },

        lineStyle: { width: 2 },

      },

    ],

  }

})



async function loadChildren() {

  const data = await request<{ items: ChildItem[] }>({

    url: '/parent/children',

    method: 'GET',

  })

  const items = data.items ?? []

  children.value = items

  if (items.length === 0) {

    errorMsg.value = '暂无绑定孩子，请确认学校已登记家长手机号'

    return

  }

  const saved = uni.getStorageSync(STORAGE_KEY)

  const sid = saved ? Number(saved) : NaN

  const found = items.find((x) => x.id === sid)

  currentId.value = found ? found.id : items[0].id

  uni.setStorageSync(STORAGE_KEY, String(currentId.value))

}



async function loadStatsAndTrend() {

  if (!currentId.value) return

  const sid = currentId.value

  const [statsData, trendData] = await Promise.all([

    request<{

      totalMinutes: number

      sessionCount: number

      passRate: number

    }>({

      url: `/parent/students/${sid}/stats-week`,

      method: 'GET',

    }),

    request<{ labels: string[]; values: number[] }>({

      url: `/parent/students/${sid}/activity-trend`,

      method: 'GET',

    }),

  ])

  stats.value = {

    totalMinutes: statsData.totalMinutes ?? 0,

    sessionCount: statsData.sessionCount ?? 0,

    passRate: statsData.passRate ?? 0,

  }

  trend.value = {

    labels: trendData.labels ?? [],

    values: trendData.values ?? [],

  }

}



function onTapHeader() {

  if (children.value.length <= 1) return

  const names = children.value.map(

    (c) => c.user?.name?.trim() || `孩子${c.id}`

  )

  uni.showActionSheet({

    itemList: names,

    success: (res) => {

      const idx = res.tapIndex

      const picked = children.value[idx]

      if (picked) {

        currentId.value = picked.id

        uni.setStorageSync(STORAGE_KEY, String(picked.id))

        loadStatsAndTrend().catch(() => {

          uni.showToast({ title: '加载失败', icon: 'none' })

        })

      }

    },

  })

}



function goChildData() {

  if (!currentId.value) return

  uni.navigateTo({

    url: `/pages/parent/detail?studentId=${currentId.value}`,

  })

}



function goReport() {

  if (!currentId.value) return

  uni.navigateTo({

    url: `/pages/parent/report/index?studentId=${currentId.value}`,

  })

}



function goHomework() {

  if (!currentId.value) return

  uni.navigateTo({

    url: `/pages/parent/homework/index?studentId=${currentId.value}`,

  })

}



onMounted(async () => {

  if (!getToken()) {

    uni.reLaunch({ url: '/pages/common/login' })

    return

  }

  try {

    await loadChildren()

    if (children.value.length > 0) {

      await loadStatsAndTrend()

    }

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

  flex: 1;

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



.switch-hint {

  font-size: 28rpx;

  color: #1677ff;

  flex-shrink: 0;

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



.echart {

  width: 100%;

}



.btn-row {

  display: flex;

  flex-direction: column;

  gap: 20rpx;

}



.btn {

  border-radius: 16rpx;

  font-size: 30rpx;

  line-height: 2.2;

}



.btn.primary {

  background: linear-gradient(90deg, #1677ff, #4096ff);

  color: #fff;

  border: none;

}

</style>
