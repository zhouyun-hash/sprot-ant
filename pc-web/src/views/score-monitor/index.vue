<template>
  <div>
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6" v-for="(s, i) in statCards" :key="i">
        <div class="stat-card" :style="{ background: s.bg }">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </el-col>
    </el-row>

    <el-card class="page-card">
      <template #header>
        <div class="toolbar">
          <span>成绩实时监控</span>
          <el-space>
            <el-tag v-if="autoRefresh" type="success" size="small">自动刷新中</el-tag>
            <el-switch v-model="autoRefresh" active-text="自动" inactive-text="手动" @change="toggleAutoRefresh" />
            <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
          </el-space>
        </div>
      </template>

      <el-table :data="rows" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="学生姓名" min-width="120">
          <template #default="{ row }">{{ row.student?.user?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="project" label="项目" min-width="120" />
        <el-table-column prop="result" label="成绩" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="审核状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.reviewStatus)" size="small">
              {{ statusLabel(row.reviewStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          background
          layout="total, prev, pager, next"
          :total="total"
          @current-change="load"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import request from '@/utils/request';

const rows = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const autoRefresh = ref(false);
const query = reactive({ page: 1, pageSize: 20 });
let timer: ReturnType<typeof setInterval> | null = null;

const statCards = computed(() => {
  const all = rows.value;
  const pending = all.filter((r) => r.reviewStatus === 'pending').length;
  const approved = all.filter((r) => r.reviewStatus === 'approved').length;
  const today = all.filter((r) => {
    if (!r.createdAt) return false;
    return new Date(r.createdAt).toDateString() === new Date().toDateString();
  }).length;

  return [
    { label: '总成绩数', value: total.value, bg: 'linear-gradient(135deg, #1a73e8, #4fc3f7)' },
    { label: '待审核数', value: pending, bg: 'linear-gradient(135deg, #fb8c00, #ffd54f)' },
    { label: '已通过数', value: approved, bg: 'linear-gradient(135deg, #43a047, #81c784)' },
    { label: '今日新增', value: today, bg: 'linear-gradient(135deg, #8e24aa, #ce93d8)' },
  ];
});

function statusType(s: string) {
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'danger';
  return 'warning';
}

function statusLabel(s: string) {
  if (s === 'approved') return '已通过';
  if (s === 'rejected') return '已驳回';
  return '待审核';
}

async function load() {
  loading.value = true;
  try {
    const res = await request.get('/scores', { params: { page: query.page, pageSize: query.pageSize } });
    rows.value = res.data?.items || [];
    total.value = Number(res.data?.total || 0);
  } finally {
    loading.value = false;
  }
}

function toggleAutoRefresh(val: boolean) {
  if (val) {
    timer = setInterval(load, 30000);
  } else {
    if (timer) clearInterval(timer);
    timer = null;
  }
}

onMounted(load);
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.stat-card {
  padding: 20px;
  border-radius: 12px;
  color: #fff;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
}
.stat-label {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 4px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
