<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>预警管理</span>
        <el-button @click="load">刷新</el-button>
      </div>
    </template>
    <el-table :data="rows" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="className" label="班级" />
      <el-table-column prop="studentName" label="学生" />
      <el-table-column prop="message" label="预警信息" min-width="240" />
      <el-table-column prop="status" label="状态" width="120" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/utils/request';
const rows = ref<any[]>([]);
async function load() {
  const res = await request.get('/alerts', { params: { page: 1, pageSize: 50 } });
  rows.value = res.data?.items || [];
}
onMounted(load);
</script>
