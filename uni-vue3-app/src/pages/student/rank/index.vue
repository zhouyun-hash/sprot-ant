<template>
  <view class="page">
    <view class="toolbar card">
      <view class="seg-row">
        <view
          v-for="opt in rankTypeOptions"
          :key="opt.value"
          :class="['seg', rankType === opt.value && 'seg-on']"
          @click="setRankType(opt.value)"
        >
          <text>{{ opt.label }}</text>
        </view>
      </view>
      <view class="seg-row">
        <view
          v-for="opt in periodOptions"
          :key="opt.value"
          :class="['seg', period === opt.value && 'seg-on']"
          @click="setPeriod(opt.value)"
        >
          <text>{{ opt.label }}</text>
        </view>
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
      <view v-if="loading && !list.length" class="hint">加载中…</view>
      <view v-else-if="errorMsg" class="hint err">{{ errorMsg }}</view>
      <view v-else-if="!list.length" class="hint">暂无排行数据</view>
      <view v-else class="list card">
        <view
          v-for="row in list"
          :key="row.studentId"
          :class="['row', isSelf(row.studentId) && 'row-self']"
        >
          <view :class="['rank-num', rankClass(row.rank)]">
            <text>{{ row.rank }}</text>
          </view>
          <image
            v-if="avatarForRow(row)"
            class="avatar"
            :src="avatarForRow(row)!"
            mode="aspectFill"
          />
          <view v-else class="avatar avatar-ph">{{ nameInitial(row.studentName) }}</view>
          <view class="row-mid">
            <text class="stu-name">{{ row.studentName }}</text>
            <text v-if="rankType === 'school' && row.className" class="sub">{{
              row.className
            }}</text>
          </view>
          <view class="points-wrap">
            <text class="points">{{ formatPoints(row.points) }}</text>
            <text class="unit">分</text>
          </view>
        </view>
        <view v-if="loadMoreLoading" class="footer">加载中…</view>
        <view v-else-if="hasMore" class="footer muted">上拉加载更多</view>
        <view v-else-if="list.length > 0" class="footer muted">没有更多了</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'

type RankType = 'school' | 'class'
type Period = 'week' | 'month'

type RankItem = {
  rank: number
  studentId: number
  studentName: string
  /** 相对路径或完整 URL，空则显示首字占位 */
  avatar?: string | null
  studentNo: string
  classId: number
  className: string
  points: number
}

const rankTypeOptions: { value: RankType; label: string }[] = [
  { value: 'school', label: '全校榜' },
  { value: 'class', label: '班级榜' },
]

const periodOptions: { value: Period; label: string }[] = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
]

const rankType = ref<RankType>('school')
const period = ref<Period>('week')

const myStudentId = ref<number | null>(null)
const myClassId = ref<number | null>(null)

const loading = ref(true)
const refreshing = ref(false)
const loadMoreLoading = ref(false)
const errorMsg = ref('')

const allItems = ref<RankItem[]>([])
const pageSize = 20
const page = ref(1)

const list = computed(() => {
  const end = page.value * pageSize
  return allItems.value.slice(0, end)
})

const hasMore = computed(() => list.value.length < allItems.value.length)

function nameInitial(name: string) {
  const n = (name || '').trim()
  return n ? n.slice(0, 1) : '同'
}

function rankClass(r: number) {
  if (r === 1) return 'r1'
  if (r === 2) return 'r2'
  if (r === 3) return 'r3'
  return ''
}

function formatPoints(p: number) {
  if (!Number.isFinite(p)) return '0'
  return Number(p).toFixed(1)
}

function isSelf(sid: number) {
  return myStudentId.value != null && sid === myStudentId.value
}

function resolveAvatarUrl(raw: string): string {
  const av = raw.trim()
  if (!av) return ''
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return av.startsWith('http') ? av : `${base.replace(/\/$/, '')}${av.startsWith('/') ? '' : '/'}${av}`
}

/** 使用排行接口返回的 avatar，缺省时首字占位 */
function avatarForRow(row: RankItem): string | null {
  const av = row.avatar
  if (av && typeof av === 'string' && av.trim().length > 0) {
    return resolveAvatarUrl(av)
  }
  return null
}

async function loadMe() {
  const data = await request<{
    id?: number
    classId?: number
  }>({ url: '/students/me', method: 'GET' })
  const id = typeof data.id === 'number' ? data.id : Number(data.id)
  if (Number.isFinite(id)) myStudentId.value = id
  const cid = typeof data.classId === 'number' ? data.classId : Number(data.classId)
  if (Number.isFinite(cid)) myClassId.value = cid
}

function buildQuery(): string {
  const q = new URLSearchParams()
  q.set('type', rankType.value)
  q.set('period', period.value)
  if (rankType.value === 'class' && myClassId.value != null) {
    q.set('classId', String(myClassId.value))
  }
  return q.toString()
}

async function fetchRank(resetPage: boolean) {
  if (rankType.value === 'class' && myClassId.value == null) {
    await loadMe()
    if (myClassId.value == null) {
      throw new Error('无法获取班级信息')
    }
  }
  const qs = buildQuery()
  const data = await request<{
    items: RankItem[]
  }>({
    url: `/rank?${qs}`,
    method: 'GET',
  })
  allItems.value = data.items ?? []
  if (resetPage) page.value = 1
  else {
    page.value = Math.min(page.value, Math.ceil(allItems.value.length / pageSize) || 1)
  }
}

async function doLoad(initial: boolean) {
  if (initial) loading.value = true
  errorMsg.value = ''
  try {
    await loadMe()
    await fetchRank(true)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载失败'
    allItems.value = []
  } finally {
    loading.value = false
  }
}

async function onRefresh() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await fetchRank(true)
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '刷新失败',
      icon: 'none',
    })
  } finally {
    refreshing.value = false
  }
}

function onScrollToLower() {
  if (!hasMore.value || loadMoreLoading.value || loading.value) return
  loadMoreLoading.value = true
  setTimeout(() => {
    page.value += 1
    loadMoreLoading.value = false
  }, 200)
}

async function setRankType(v: RankType) {
  if (rankType.value === v) return
  rankType.value = v
  loading.value = true
  await doLoad(false)
}

async function setPeriod(v: Period) {
  if (period.value === v) return
  period.value = v
  loading.value = true
  await doLoad(false)
}

onMounted(async () => {
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/common/login' })
    return
  }
  await doLoad(true)
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

.toolbar {
  padding: 20rpx 16rpx 24rpx;
  margin-bottom: 24rpx;
  flex-shrink: 0;
}

.seg-row {
  display: flex;
  flex-direction: row;
  margin-top: 12rpx;
}

.seg-row:first-child {
  margin-top: 0;
}

.seg {
  flex: 1;
  text-align: center;
  padding: 18rpx 12rpx;
  margin: 0 8rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
  font-size: 28rpx;
  color: #666;
}

.seg-on {
  background: linear-gradient(135deg, #e6f4ff, #f0f7ff);
  color: #1677ff;
  font-weight: 600;
  border: 1px solid rgba(22, 119, 255, 0.35);
}

.scroll {
  flex: 1;
  height: 0;
  min-height: 60vh;
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
  padding: 8rpx 0 32rpx;
  margin-bottom: 24rpx;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx 28rpx;
  border-bottom: 1px solid #f0f0f0;
}

.row:last-child {
  border-bottom: none;
}

.row-self {
  background: linear-gradient(90deg, rgba(22, 119, 255, 0.08), transparent);
}

.rank-num {
  width: 56rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #666;
  text-align: center;
  flex-shrink: 0;
}

.rank-num.r1 {
  color: #d4af37;
}

.rank-num.r2 {
  color: #8e9aaf;
}

.rank-num.r3 {
  color: #cd7f32;
}

.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
  background: #eee;
}

.avatar-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #1677ff, #69b1ff);
}

.row-mid {
  flex: 1;
  margin-left: 20rpx;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.stu-name {
  font-size: 30rpx;
  color: #111;
  font-weight: 500;
}

.sub {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999;
}

.points-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.points {
  font-size: 34rpx;
  font-weight: 700;
  color: #1677ff;
}

.unit {
  font-size: 22rpx;
  color: #999;
  margin-left: 4rpx;
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
