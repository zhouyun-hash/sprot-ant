<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>场地管理</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索场地名称" clearable style="width:200px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="statusFilter" placeholder="状态" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="可用" value="available" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="停用" value="disabled" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增场地</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="场地名称" min-width="140" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="location" label="位置" min-width="200" show-overflow-tooltip />
      <el-table-column prop="capacity" label="容量" width="80" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
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

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑场地' : '新增场地'" width="560px" destroy-on-close>
    <el-form :model="form" label-width="80px">
      <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" style="width:100%">
          <el-option label="田径场" value="田径场" />
          <el-option label="篮球场" value="篮球场" />
          <el-option label="足球场" value="足球场" />
          <el-option label="游泳池" value="游泳池" />
          <el-option label="体育馆" value="体育馆" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="位置"><el-input v-model="form.location" /></el-form-item>
      <el-form-item label="容量"><el-input-number v-model="form.capacity" :min="0" /></el-form-item>
      <el-form-item label="设施"><el-input v-model="form.facilities" type="textarea" :rows="2" /></el-form-item>
      <el-form-item label="使用规则"><el-input v-model="form.rules" type="textarea" :rows="2" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="可用" value="available" />
          <el-option label="维护中" value="maintenance" />
          <el-option label="停用" value="disabled" />
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

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const form = ref({ name: '', type: '', location: '', capacity: 0, facilities: '', rules: '', status: 'available' });

function statusLabel(s: string) {
  const m: Record<string, string> = { available: '可用', maintenance: '维护中', disabled: '停用' };
  return m[s] || s;
}

function statusTagType(s: string) {
  const m: Record<string, string> = { available: 'success', maintenance: 'warning', disabled: 'info' };
  return m[s] || '';
}

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/venues', { params: { page: page.value, size: size.value, keyword: keyword.value, status: statusFilter.value } });
    rows.value = data.rows;
    total.value = data.total;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  form.value = { name: '', type: '', location: '', capacity: 0, facilities: '', rules: '', status: 'available' };
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = { name: row.name, type: row.type || '', location: row.location || '', capacity: row.capacity, facilities: row.facilities || '', rules: row.rules || '', status: row.status };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/venues/${editingId.value}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await request.post('/venues', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此场地？', '提示', { type: 'warning' });
  await request.delete(`/venues/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
