<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>数据备份</span>
        <el-button type="primary" :loading="creating" @click="handleCreate">新建备份</el-button>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="备份名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'auto' ? 'info' : ''" size="small">{{ row.type === 'auto' ? '自动' : '手动' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fileSize" label="文件大小" width="120">
        <template #default="{ row }">
          {{ formatSize(row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operatorName" label="操作人" width="100" />
      <el-table-column prop="createdAt" label="时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :disabled="row.status !== 'completed'" @click="handleDownload(row)">下载</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const creating = ref(false);

function statusTagType(s: string) {
  const m: Record<string, string> = { completed: 'success', running: 'warning', failed: 'danger' };
  return m[s] || 'info';
}

function statusLabel(s: string) {
  const m: Record<string, string> = { completed: '已完成', running: '进行中', failed: '失败' };
  return m[s] || s;
}

function formatSize(bytes: number) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/backups', { params: { page: page.value, size: size.value } });
    rows.value = data.rows ?? data.items ?? [];
    total.value = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  await ElMessageBox.confirm('确定创建一次数据备份？', '提示', { type: 'info' });
  creating.value = true;
  try {
    await request.post('/backups');
    ElMessage.success('备份任务已创建');
    await load();
  } finally {
    creating.value = false;
  }
}

function handleDownload(row: any) {
  if (row.fileUrl) {
    window.open(row.fileUrl, '_blank');
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此备份？', '提示', { type: 'warning' });
  await request.delete(`/backups/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
