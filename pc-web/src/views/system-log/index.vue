<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>系统日志</span>
        <div>
          <el-input v-model="filters.username" placeholder="用户名" clearable style="width:140px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="filters.action" placeholder="动作" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
            <el-option label="GET" value="GET" />
          </el-select>
          <el-date-picker v-model="filters.dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:260px;margin-right:10px" @change="load" />
          <el-button @click="load">查询</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="action" label="动作" width="90">
        <template #default="{ row }">
          <el-tag :type="actionTagType(row.action)" size="small">{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resource" label="资源路径" min-width="220" show-overflow-tooltip />
      <el-table-column prop="duration" label="耗时(ms)" width="100" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status >= 400 ? 'danger' : 'success'" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="createdAt" label="时间" width="170" />
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[20,50,100]" @change="load" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '@/utils/request';

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);

const filters = reactive({
  username: '',
  action: '',
  dateRange: null as [string, string] | null,
});

function actionTagType(a: string) {
  const m: Record<string, string> = { POST: 'success', PUT: 'warning', DELETE: 'danger', GET: 'info' };
  return m[a] || '';
}

async function load() {
  loading.value = true;
  try {
    const params: any = { page: page.value, size: size.value };
    if (filters.username) params.username = filters.username;
    if (filters.action) params.action = filters.action;
    if (filters.dateRange) {
      params.startDate = filters.dateRange[0];
      params.endDate = filters.dateRange[1];
    }
    const { data } = await request.get('/audit-logs', { params });
    rows.value = data.rows ?? data.items ?? [];
    total.value = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
