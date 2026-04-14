<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>家校消息管理</span>
        <el-button type="primary" @click="openSend">发送消息</el-button>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="content" label="内容预览" min-width="240" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="发送时间" width="170" />
      <el-table-column prop="readCount" label="已读数" width="80" />
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

  <el-dialog v-model="dialogVisible" title="发送家校消息" width="560px" destroy-on-close>
    <el-form :model="form" label-width="80px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="5" /></el-form-item>
      <el-form-item label="目标">
        <el-select v-model="form.targetType" style="width:100%">
          <el-option label="全部家长" value="all" />
          <el-option label="指定班级" value="role" />
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
const loading = ref(false);

const dialogVisible = ref(false);
const saving = ref(false);
const defaultForm = () => ({ title: '', content: '', targetType: 'all', targetIds: '' });
const form = ref(defaultForm());

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/messages', {
      params: { page: page.value, size: size.value, type: 'parent_notification' },
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
    const payload: any = { ...form.value, type: 'parent_notification' };
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
