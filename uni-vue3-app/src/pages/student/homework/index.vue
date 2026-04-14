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
            <text class="title">{{ item.title }}</text>
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
  const p = reset ? 1 : page.value
  const sub =
    tab.value === 'pending' ? 'pending' : ('completed' as const)
  const data = await request<{
    items: HomeworkRow[]
    total: number
    page: number
    pageSize: number
  }>({
    url: `/homework?page=${p}&pageSize=${pageSize}&submissionStatus=${sub}`,
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

async function loadFirst() {
  loading.value = true
  errorMsg.value = ''
  try {
    page.value = 1
    await fetchPage(true)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载失败'
    allItems.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function switchTab(t: Tab) {
  if (tab.value === t) return
  tab.value = t
  loading.value = true
  try {
    await fetchPage(true)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function onRefresh() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await fetchPage(true)
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '刷新失败',
      icon: 'none',
    })
  } finally {
    refreshing.value = false
  }
}

async function onScrollToLower() {
  if (!hasMore.value || loadMoreLoading.value || loading.value) return
  if (allItems.value.length >= total.value) return
  loadMoreLoading.value = true
  try {
    page.value += 1
    await fetchPage(false)
  } catch {
    page.value -= 1
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loadMoreLoading.value = false
  }
}

function onRow(item: HomeworkRow) {
  if (tab.value === 'pending') {
    uni.navigateTo({
      url: `/pages/student/homework/detail?id=${item.id}`,
    })
    return
  }
  uni.navigateTo({
    url: `/pages/student/homework/detail?id=${item.id}&readonly=1`,
  })
}

onMounted(async () => {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/common/login' })
    return
  }
  await loadFirst()
})
</script>

<style scoped lang="scss">
.page {
  height: 100vh;
  box-sizing: border-box;
  background: linear-gradient(180deg, #e8f4ff 0%, #f5f5f5 200rpx);
  display: flex;
  flex-direction: column;
  padding: 24rpx 24rpx 0;
  overflow: hidden;
}

.card {
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.tabs {
  display: flex;
  flex-direction: row;
  margin-bottom: 24rpx;
  padding: 12rpx;
  flex-shrink: 0;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  font-size: 28rpx;
  color: #666;
  border-radius: 12rpx;
}

.tab-on {
  background: linear-gradient(135deg, #e6f4ff, #f0f7ff);
  color: #1677ff;
  font-weight: 600;
}

.scroll {
  flex: 1;
  height: 0;
  min-height: 50vh;
}

.hint {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.hint.err {
  color: #cf1322;
}

.list {
  padding-bottom: 32rpx;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 28rpx;
  margin-bottom: 16rpx;
}

.row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111;
}

.deadline {
  font-size: 24rpx;
  color: #666;
}

.sub {
  font-size: 22rpx;
  color: #999;
}

.arrow {
  font-size: 40rpx;
  color: #ccc;
  margin-left: 12rpx;
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
