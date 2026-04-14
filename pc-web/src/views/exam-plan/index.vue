<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>体测计划管理</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索计划名称" clearable style="width:200px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="statusFilter" placeholder="状态" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增计划</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="计划名称" min-width="160" />
      <el-table-column prop="schoolYear" label="学年" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startDate" label="开始日期" width="120" />
      <el-table-column prop="endDate" label="结束日期" width="120" />
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

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑体测计划' : '新增体测计划'" width="600px" destroy-on-close>
    <el-form :model="form" label-width="100px">
      <el-form-item label="计划名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="学年"><el-input v-model="form.schoolYear" placeholder="如：2025-2026" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
          <el-option label="进行中" value="ongoing" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </el-form-item>
      <el-form-item label="开始日期"><el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="结束日期"><el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="项目ID"><el-input v-model="form.projectIds" placeholder="多个用逗号分隔，如：1,2,3" /></el-form-item>
      <el-form-item label="年级ID"><el-input v-model="form.gradeIds" placeholder="多个用逗号分隔，如：1,2,3" /></el-form-item>
      <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
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
const form = ref({ name: '', schoolYear: '', status: 'draft', startDate: '', endDate: '', projectIds: '', gradeIds: '', description: '' });

function statusLabel(s: string) {
  const m: Record<string, string> = { draft: '草稿', published: '已发布', ongoing: '进行中', completed: '已完成' };
  return m[s] || s;
}

function statusTagType(s: string) {
  const m: Record<string, string> = { draft: 'info', published: '', ongoing: 'warning', completed: 'success' };
  return m[s] || '';
}

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/exam-plans', { params: { page: page.value, size: size.value, keyword: keyword.value, status: statusFilter.value } });
    rows.value = data.rows;
    total.value = data.total;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  form.value = { name: '', schoolYear: '', status: 'draft', startDate: '', endDate: '', projectIds: '', gradeIds: '', description: '' };
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = {
    name: row.name,
    schoolYear: row.schoolYear || '',
    status: row.status || 'draft',
    startDate: row.startDate || '',
    endDate: row.endDate || '',
    projectIds: Array.isArray(row.projectIds) ? row.projectIds.join(',') : (row.projectIds || ''),
    gradeIds: Array.isArray(row.gradeIds) ? row.gradeIds.join(',') : (row.gradeIds || ''),
    description: row.description || '',
  };
  dialogVisible.value = true;
}

function parseIds(str: string): number[] {
  return str.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      projectIds: parseIds(form.value.projectIds),
      gradeIds: parseIds(form.value.gradeIds),
    };
    if (editingId.value) {
      await request.put(`/exam-plans/${editingId.value}`, payload);
      ElMessage.success('更新成功');
    } else {
      await request.post('/exam-plans', payload);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此体测计划？', '提示', { type: 'warning' });
  await request.delete(`/exam-plans/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
