<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>RTSP 流配置</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索名称/URL" clearable style="width:200px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="statusFilter" placeholder="状态" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="活跃" value="active" />
            <el-option label="停用" value="inactive" />
            <el-option label="异常" value="error" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增流</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="url" label="URL" min-width="260" show-overflow-tooltip />
      <el-table-column prop="deviceId" label="设备ID" width="90" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="protocol" label="协议" width="90" />
      <el-table-column prop="resolution" label="分辨率" width="110" />
      <el-table-column prop="fps" label="FPS" width="70" />
      <el-table-column prop="encrypted" label="加密" width="70">
        <template #default="{ row }">
          <el-tag :type="row.encrypted ? 'success' : 'info'" size="small">{{ row.encrypted ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="success" :loading="testingId === row.id" @click="handleTest(row)">测试</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑 RTSP 流' : '新增 RTSP 流'" width="600px" destroy-on-close>
    <el-form :model="form" label-width="90px">
      <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="URL"><el-input v-model="form.url" placeholder="rtsp://..." /></el-form-item>
      <el-form-item label="设备ID"><el-input v-model="form.deviceId" /></el-form-item>
      <el-form-item label="协议">
        <el-select v-model="form.protocol" style="width:100%">
          <el-option label="TCP" value="TCP" />
          <el-option label="UDP" value="UDP" />
        </el-select>
      </el-form-item>
      <el-form-item label="分辨率">
        <el-select v-model="form.resolution" style="width:100%">
          <el-option label="1920x1080" value="1920x1080" />
          <el-option label="1280x720" value="1280x720" />
          <el-option label="640x480" value="640x480" />
        </el-select>
      </el-form-item>
      <el-form-item label="FPS"><el-input-number v-model="form.fps" :min="1" :max="120" /></el-form-item>
      <el-form-item label="加密"><el-switch v-model="form.encrypted" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="活跃" value="active" />
          <el-option label="停用" value="inactive" />
          <el-option label="异常" value="error" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
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
const keyword = ref('');
const statusFilter = ref('');
const loading = ref(false);
const testingId = ref<number | null>(null);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const defaultForm = () => ({ name: '', url: '', deviceId: '', protocol: 'TCP', resolution: '1920x1080', fps: 25, encrypted: false, status: 'active' });
const form = ref(defaultForm());

function statusLabel(s: string) {
  const m: Record<string, string> = { active: '活跃', inactive: '停用', error: '异常' };
  return m[s] || s;
}

function statusTagType(s: string) {
  const m: Record<string, string> = { active: 'success', inactive: 'info', error: 'danger' };
  return m[s] || '';
}

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/rtsp-streams', {
      params: { page: page.value, size: size.value, keyword: keyword.value, status: statusFilter.value },
    });
    rows.value = data.rows;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.value = defaultForm();
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = {
    name: row.name,
    url: row.url,
    deviceId: row.deviceId,
    protocol: row.protocol || 'TCP',
    resolution: row.resolution || '1920x1080',
    fps: row.fps ?? 25,
    encrypted: !!row.encrypted,
    status: row.status,
  };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/rtsp-streams/${editingId.value}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await request.post('/rtsp-streams', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function handleTest(row: any) {
  testingId.value = row.id;
  try {
    const { data } = await request.post(`/rtsp-streams/${row.id}/test`);
    if (data?.success) {
      ElMessage.success('连接测试成功');
    } else {
      ElMessage.warning(data?.message || '连接测试失败');
    }
  } catch {
    ElMessage.error('测试请求失败');
  } finally {
    testingId.value = null;
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此 RTSP 流？', '提示', { type: 'warning' });
  await request.delete(`/rtsp-streams/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
