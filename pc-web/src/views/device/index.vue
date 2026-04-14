<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>设备管理</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索设备名称/SN" clearable style="width:200px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="statusFilter" placeholder="状态" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="异常" value="error" />
          </el-select>
          <el-select v-model="typeFilter" placeholder="类型" clearable style="width:130px;margin-right:10px" @change="load">
            <el-option label="摄像头" value="摄像头" />
            <el-option label="边缘盒子" value="边缘盒子" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增设备</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="设备名称" min-width="140" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="sn" label="序列号" width="160" />
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="firmwareVersion" label="固件版本" width="120" />
      <el-table-column prop="location" label="位置" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="handleRestart(row)">重启</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑设备' : '新增设备'" width="560px" destroy-on-close>
    <el-form :model="form" label-width="90px">
      <el-form-item label="设备名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" style="width:100%">
          <el-option label="摄像头" value="摄像头" />
          <el-option label="边缘盒子" value="边缘盒子" />
        </el-select>
      </el-form-item>
      <el-form-item label="序列号"><el-input v-model="form.sn" /></el-form-item>
      <el-form-item label="IP 地址"><el-input v-model="form.ip" /></el-form-item>
      <el-form-item label="固件版本"><el-input v-model="form.firmwareVersion" /></el-form-item>
      <el-form-item label="位置"><el-input v-model="form.location" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
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
const typeFilter = ref('');
const loading = ref(false);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const defaultForm = () => ({ name: '', type: '', sn: '', ip: '', firmwareVersion: '', location: '', status: 'online' });
const form = ref(defaultForm());

function statusLabel(s: string) {
  const m: Record<string, string> = { online: '在线', offline: '离线', error: '异常' };
  return m[s] || s;
}

function statusTagType(s: string) {
  const m: Record<string, string> = { online: 'success', offline: 'info', error: 'danger' };
  return m[s] || '';
}

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/devices', {
      params: { page: page.value, size: size.value, keyword: keyword.value, status: statusFilter.value, type: typeFilter.value },
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
  form.value = { name: row.name, type: row.type, sn: row.sn, ip: row.ip, firmwareVersion: row.firmwareVersion || '', location: row.location || '', status: row.status };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/devices/${editingId.value}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await request.post('/devices', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function handleRestart(row: any) {
  await ElMessageBox.confirm(`确定重启设备「${row.name}」？`, '提示', { type: 'warning' });
  await request.put(`/devices/${row.id}/restart`);
  ElMessage.success('重启指令已发送');
  await load();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此设备？', '提示', { type: 'warning' });
  await request.delete(`/devices/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
