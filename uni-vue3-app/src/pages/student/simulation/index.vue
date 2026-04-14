<template>
  <view class="page">
    <view class="card block">
      <text class="label">测试项目</text>
      <picker
        mode="selector"
        :range="projectLabels"
        :value="projectIndex"
        @change="onProjectChange"
      >
        <view class="picker-val">{{ currentProject?.label || '请选择' }}</view>
      </picker>
      <text class="hint">跳绳、仰卧起坐、立定跳远、50/800/1000 米跑（成绩口径与体测记录一致）</text>
    </view>

    <view class="card block">
      <text class="label">历史最好成绩</text>
      <view v-if="historyLoading" class="muted">加载中…</view>
      <view v-else-if="historicalBest != null" class="best">
        <text class="best-num">{{ formatNum(historicalBest) }}</text>
        <text class="best-unit">{{ historyUnit }}</text>
      </view>
      <text v-else class="muted">暂无体测记录，可直接输入模拟成绩</text>
      <button
        v-if="historicalBest != null"
        class="btn ghost"
        size="mini"
        @click="useHistory"
      >
        使用历史成绩
      </button>
    </view>

    <view class="card block">
      <text class="label">模拟成绩输入</text>
      <input
        class="input"
        type="digit"
        placeholder="请输入本次用于模拟的数值"
        :value="inputStr"
        @input="onInput"
      />
      <text class="unit-tip">单位：{{ currentProject?.unit || '—' }}（跑步类为「秒」）</text>
    </view>

    <button class="btn primary" :disabled="simLoading" @click="runSimulation">
      {{ simLoading ? '模拟中…' : '开始模拟' }}
    </button>

    <view v-if="result" class="card block result">
      <text class="label">模拟结果</text>
      <view class="score-row">
        <text class="score-label">预测得分</text>
        <text class="score-num">{{ result.predictedScore }}</text>
        <text class="score-suffix">分</text>
      </view>
      <text class="suggest">{{ result.suggestions }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'

type ProjectItem = {
  key: string
  label: string
  unit: string
  higherBetter: boolean
}

type SimResult = {
  predictedScore: number
  suggestions: string
  historicalBest: number | null
  projectLabel: string
  inputValue: number
}

const projects = ref<ProjectItem[]>([])
const projectIndex = ref(0)
const historicalBest = ref<number | null>(null)
const historyUnit = ref('')
const historyLoading = ref(false)
const inputStr = ref('')
const simLoading = ref(false)
const result = ref<SimResult | null>(null)

const projectLabels = computed(() => projects.value.map((p) => p.label))

const currentProject = computed(() => {
  const list = projects.value
  const i = projectIndex.value
  if (!list.length || i < 0 || i >= list.length) return null
  return list[i]
})

function formatNum(n: number) {
  if (!Number.isFinite(n)) return '—'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

async function loadProjects() {
  const data = await request<{ items: ProjectItem[] }>({
    url: '/simulation/projects',
    method: 'GET',
  })
  projects.value = data.items ?? []
  if (projects.value.length) {
    await loadHistoryBest()
  }
}

async function loadHistoryBest() {
  const p = currentProject.value
  if (!p) return
  historyLoading.value = true
  historicalBest.value = null
  historyUnit.value = p.unit
  try {
    const data = await request<{
      historicalBest: number | null
      unit: string
    }>({
      url: `/simulation/history-best?projectKey=${encodeURIComponent(p.key)}`,
      method: 'GET',
    })
    historicalBest.value =
      data.historicalBest != null ? Number(data.historicalBest) : null
    historyUnit.value = data.unit || p.unit
  } catch {
    historicalBest.value = null
  } finally {
    historyLoading.value = false
  }
}

function onProjectChange(e: { detail: { value: string } }) {
  projectIndex.value = Number(e.detail.value) || 0
  result.value = null
  loadHistoryBest()
}

function onInput(e: { detail: { value: string } }) {
  inputStr.value = e.detail.value
  result.value = null
}

function useHistory() {
  if (historicalBest.value == null) return
  inputStr.value = String(historicalBest.value)
  result.value = null
}

async function runSimulation() {
  const p = currentProject.value
  if (!p) {
    uni.showToast({ title: '请选择项目', icon: 'none' })
    return
  }
  const n = Number.parseFloat(inputStr.value.trim())
  if (!Number.isFinite(n) || n < 0) {
    uni.showToast({ title: '请输入有效成绩', icon: 'none' })
    return
  }
  simLoading.value = true
  result.value = null
  try {
    const data = await request<SimResult>({
      url: '/simulation',
      method: 'POST',
      data: { projectKey: p.key, inputValue: n },
    })
    result.value = data
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '模拟失败',
      icon: 'none',
    })
  } finally {
    simLoading.value = false
  }
}

onMounted(async () => {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/common/login' })
    return
  }
  try {
    await loadProjects()
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

.label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.picker-val {
  padding: 22rpx 24rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  font-size: 30rpx;
  color: #111;
}

.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #999;
  line-height: 1.4;
}

.best {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.best-num {
  font-size: 44rpx;
  font-weight: 700;
  color: #1677ff;
}

.best-unit {
  font-size: 26rpx;
  color: #666;
}

.muted {
  font-size: 26rpx;
  color: #999;
}

.input {
  width: 100%;
  padding: 22rpx 24rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.unit-tip {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #999;
}

.btn {
  margin-top: 8rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.btn.primary {
  background: linear-gradient(135deg, #1677ff, #69b1ff);
  color: #fff;
}

.btn.ghost {
  margin-top: 16rpx;
  background: #f0f7ff;
  color: #1677ff;
  border: 1px solid rgba(22, 119, 255, 0.35);
}

.result {
  border-left: 6rpx solid #1677ff;
}

.score-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-bottom: 20rpx;
}

.score-label {
  font-size: 28rpx;
  color: #333;
  margin-right: 16rpx;
}

.score-num {
  font-size: 56rpx;
  font-weight: 700;
  color: #1677ff;
}

.score-suffix {
  font-size: 26rpx;
  color: #666;
  margin-left: 6rpx;
}

.suggest {
  font-size: 26rpx;
  color: #444;
  line-height: 1.55;
}
</style>
