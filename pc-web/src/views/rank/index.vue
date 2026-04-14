<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>排行榜</span>
        <el-space>
          <el-select v-model="period" style="width: 120px" @change="load">
            <el-option label="周榜" value="week" />
            <el-option label="月榜" value="month" />
          </el-select>
          <el-button @click="load">刷新</el-button>
        </el-space>
      </div>
    </template>
    <el-table :data="rows" stripe>
      <el-table-column prop="rank" label="排名" width="80" />
      <el-table-column prop="studentName" label="学生" />
      <el-table-column prop="className" label="班级" />
      <el-table-column prop="points" label="积分" width="120" />
      <el-table-column prop="avgScore" label="平均分" width="120" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/utils/request';
const rows = ref<any[]>([]);
const period = ref<'week' | 'month'>('week');
async function load() {
  const res = await request.get('/rank', { params: { type: 'school', period: period.value } });
  rows.value = res.data?.items || [];
}
onMounted(load);
</script>
