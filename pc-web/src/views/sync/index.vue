<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>数据上报</span>
        <el-button type="primary" @click="triggerSync">手动触发上报</el-button>
      </div>
    </template>
    <el-table :data="rows" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="target" label="目标系统" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="recordCount" label="记录数" width="120" />
      <el-table-column prop="createdAt" label="时间" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
const rows = ref<any[]>([]);
async function loadLogs() {
  const res = await request.get('/sync/logs', { params: { page: 1, pageSize: 50 } });
  rows.value = res.data?.items || [];
}
async function triggerSync() {
  await request.post('/sync/trigger');
  ElMessage.success('已触发上报任务');
  loadLogs();
}
onMounted(loadLogs);
</script>
