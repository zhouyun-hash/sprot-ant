<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>消息推送管理</span>
        <div>
          <el-select v-model="typeFilter" placeholder="消息类型" clearable style="width:130px;margin-right:10px" @change="load">
            <el-option label="系统消息" value="system" />
            <el-option label="通知" value="notification" />
            <el-option label="预警" value="alert" />
          </el-select>
          <el-button type="primary" @click="openSend">发送消息</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type] || ''" size="small">{{ typeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="targetType" label="目标范围" width="120">
        <template #default="{ row }">
          {{ targetLabel(row.targetType) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'sent' ? 'success' : 'info'" size="small">{{ row.status === 'sent' ? '已发送' : '草稿' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="readCount" label="已读数" width="80" />
      <el-table-column prop="createdAt" label="发送时间" width="170" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" title="发送消息" width="560px" destroy-on-close>
    <el-form :model="form" label-width="90px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" style="width:100%">
          <el-option label="系统消息" value="system" />
          <el-option label="通知" value="notification" />
          <el-option label="预警" value="alert" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标范围">
        <el-select v-model="form.targetType" style="width:100%">
          <el-option label="全部" value="all" />
          <el-option label="按角色" value="role" />
          <el-option label="指定用户" value="user" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.targetType !== 'all'" label="目标ID">
        <el-input v-model="form.targetIds" placeholder="多个ID用逗号分隔" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSend">发送</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const typeFilter = ref('');
const loading = ref(false);

const dialogVisible = ref(false);
const saving = ref(false);
const defaultForm = () => ({ title: '', content: '', type: 'system', targetType: 'all', targetIds: '' });
const form = ref(defaultForm());

const typeTagMap: Record<string, string> = { system: '', notification: 'success', alert: 'danger' };

function typeLabel(t: string) {
  const m: Record<string, string> = { system: '系统消息', notification: '通知', alert: '预警' };
  return m[t] || t;
}

function targetLabel(t: string) {
  const m: Record<string, string> = { all: '全部', role: '按角色', user: '指定用户' };
  return m[t] || t;
}

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/messages', {
      params: { page: page.value, size: size.value, type: typeFilter.value || undefined },
    });
    rows.value = data.rows ?? data.items ?? [];
    total.value = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function openSend() {
  form.value = defaultForm();
  dialogVisible.value = true;
}

async function handleSend() {
  saving.value = true;
  try {
    const payload: any = { ...form.value };
    if (payload.targetIds) {
      payload.targetIds = payload.targetIds.split(',').map((s: string) => s.trim());
    } else {
      delete payload.targetIds;
    }
    await request.post('/messages', payload);
    ElMessage.success('消息已发送');
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此消息？', '提示', { type: 'warning' });
  await request.delete(`/messages/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
