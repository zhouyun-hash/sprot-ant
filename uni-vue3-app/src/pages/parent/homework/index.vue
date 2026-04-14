<template>
  <view class="page">
    <view class="tabs card">
      <view
        :class="['tab', tab === 'pending' && 'tab-on']"
        @click="switchTab('pending')"
      >
        <text>待完成</text>
      </view>
      <view
        :class="['tab', tab === 'completed' && 'tab-on']"
        @click="switchTab('completed')"
      >
        <text>已完成</text>
      </view>
    </view>

    <scroll-view
      class="scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onScrollToLower"
      :lower-threshold="120"
    >
      <view v-if="loading && !rows.length" class="hint">加载中…</view>
      <view v-else-if="errorMsg" class="hint err">{{ errorMsg }}</view>
      <view v-else-if="!rows.length" class="hint">暂无作业</view>
      <view v-else class="list">
        <view
          v-for="item in rows"
          :key="item.id"
          class="row card"
          @click="onRow(item)"
        >
          <view class="row-main">
            <view class="title-row">
              <text class="title">{{ item.title }}</text>
              <text
                :class="['status-tag', item.submission ? 'status-done' : 'status-todo']"
                >{{ item.submission ? '已提交' : '未提交' }}</text
              >
            </view>
            <text class="deadline">截止 {{ formatDeadline(item.deadline) }}</text>
            <text
              v-if="tab === 'completed' && item.submission?.submittedAt"
              class="sub"
              >提交于 {{ formatDeadline(item.submission.submittedAt) }}</text
            >
          </view>
          <text class="arrow">›</text>
        </view>
        <view v-if="loadMoreLoading" class="footer">加载中…</view>
        <view v-else-if="hasMore" class="footer muted">上拉加载更多</view>
        <view v-else-if="rows.length" class="footer muted">没有更多了</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'

type Tab = 'pending' | 'completed'

type HomeworkRow = {
  id: number
  title: string
  deadline: string
  submission?: {
    id: number
    status: string
    submittedAt: string
    videoUrl: string | null
  } | null
}

const tab = ref<Tab>('pending')
const loading = ref(true)
const refreshing = ref(false)
const loadMoreLoading = ref(false)
const errorMsg = ref('')
const studentId = ref<number | null>(null)

const allItems = ref<HomeworkRow[]>([])
const page = ref(1)
const pageSize = 15
const total = ref(0)

const rows = computed(() => allItems.value)
const hasMore = computed(() => allItems.value.length < total.value)

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

async function fetchPage(reset: boolean) {
  if (!studentId.value) return
  const p = reset ? 1 : page.value
  const sub = tab.value === 'pending' ? 'pending' : ('completed' as const)
  const data = await request<{
    items: HomeworkRow[]
    total: number
    page: number
    pageSize: number
  }>({
    url: `/parent/students/${studentId.value}/homework?page=${p}&pageSize=${pageSize}&submissionStatus=${sub}`,
    method: 'GET',
  })
  const items = data.items ?? []
  total.value = data.total ?? 0
  if (reset) {
    allItems.value = items
    page.value = 1
  } else {
    allItems.value = [...allItems.value, ...items]
  }
}

function switchTab(t: Tab) {
  if (tab.value === t) return
  tab.value = t
  loading.value = true
  fetchPage(true)
    .catch((e) => {
      errorMsg.value = e instanceof Error ? e.message : '加载失败'
    })
    .finally(() => {
      loading.value = false
    })
}

async function onRefresh() {
  refreshing.value = true
  try {
    await fetchPage(true)
  } finally {
    refreshing.value = false
  }
}

async function onScrollToLower() {
  if (!hasMore.value || loadMoreLoading.value || loading.value) return
  loadMoreLoading.value = true
  try {
    page.value += 1
    await fetchPage(false)
  } catch {
    page.value -= 1
  } finally {
    loadMoreLoading.value = false
  }
}

function onRow(item: HomeworkRow) {
  if (!studentId.value) return
  const sid = studentId.value
  if (item.submission) {
    uni.navigateTo({
      url: `/pages/parent/homework/detail?id=${item.id}&studentId=${sid}`,
    })
  } else {
    uni.navigateTo({
      url: `/pages/parent/homework/submit?id=${item.id}&studentId=${sid}`,
    })
  }
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
})

onMounted(() => {
  if (!studentId.value) return
  fetchPage(true)
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
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 24rpx 24rpx 0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.tabs {
  display: flex;
  flex-direction: row;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;
}

.tab-on {
  color: #1677ff;
  font-weight: 600;
  border-bottom: 4rpx solid #1677ff;
}

.scroll {
  flex: 1;
  height: 0;
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

.list {
  padding: 0 24rpx 48rpx;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16rpx;
}

.row-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.title-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.title {
  flex: 1;
  font-size: 30rpx;
  color: #111;
  font-weight: 500;
  min-width: 0;
}

.status-tag {
  flex-shrink: 0;
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
}

.status-todo {
  color: #d48806;
  background: rgba(250, 173, 20, 0.12);
}

.status-done {
  color: #389e0d;
  background: rgba(82, 196, 26, 0.12);
}

.deadline,
.sub {
  font-size: 24rpx;
  color: #888;
}

.arrow {
  font-size: 36rpx;
  color: #ccc;
}

.footer {
  text-align: center;
  padding: 24rpx;
  font-size: 24rpx;
  color: #999;
}

.footer.muted {
  color: #bbb;
}
</style>
