<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>版本管理</span>
        <el-button type="primary" @click="openCreate">新增版本</el-button>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="platform" label="平台" width="100">
        <template #default="{ row }">
          <el-tag :type="platformTag(row.platform)" size="small">{{ platformLabel(row.platform) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本号" width="120" />
      <el-table-column prop="forceUpdate" label="强制更新" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.forceUpdate" @change="toggleForce(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="description" label="更新说明" min-width="240" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="发布时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑版本' : '新增版本'" width="520px" destroy-on-close>
    <el-form :model="form" label-width="90px">
      <el-form-item label="平台">
        <el-select v-model="form.platform" style="width:100%">
          <el-option label="Android" value="android" />
          <el-option label="iOS" value="ios" />
          <el-option label="小程序" value="miniapp" />
        </el-select>
      </el-form-item>
      <el-form-item label="版本号"><el-input v-model="form.version" placeholder="例如 1.2.0" /></el-form-item>
      <el-form-item label="下载地址"><el-input v-model="form.downloadUrl" /></el-form-item>
      <el-form-item label="更新说明"><el-input v-model="form.description" type="textarea" :rows="4" /></el-form-item>
      <el-form-item label="强制更新"><el-switch v-model="form.forceUpdate" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
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
const loading = ref(false);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const defaultForm = () => ({ platform: 'android', version: '', downloadUrl: '', description: '', forceUpdate: false, status: 'draft' });
const form = ref(defaultForm());

function platformLabel(p: string) {
  const m: Record<string, string> = { android: 'Android', ios: 'iOS', miniapp: '小程序' };
  return m[p] || p;
}

function platformTag(p: string) {
  const m: Record<string, string> = { android: 'success', ios: '', miniapp: 'warning' };
  return m[p] || 'info';
}

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/app-versions', { params: { page: page.value, size: size.value } });
    rows.value = data.rows ?? data.items ?? [];
    total.value = data.total ?? 0;
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
  form.value = { platform: row.platform, version: row.version, downloadUrl: row.downloadUrl || '', description: row.description || '', forceUpdate: row.forceUpdate, status: row.status };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/app-versions/${editingId.value}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await request.post('/app-versions', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleForce(row: any) {
  await request.put(`/app-versions/${row.id}`, { forceUpdate: row.forceUpdate });
  ElMessage.success('已更新');
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此版本？', '提示', { type: 'warning' });
  await request.delete(`/app-versions/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
