<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>体测批次管理</span>
        <div>
          <el-input-number v-model="planIdFilter" :min="1" placeholder="计划ID" controls-position="right" style="width:130px;margin-right:10px" @change="load" />
          <el-select v-model="statusFilter" placeholder="状态" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增批次</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="批次名称" min-width="160" />
      <el-table-column prop="planId" label="所属计划ID" width="110" />
      <el-table-column prop="batchDate" label="日期" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
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

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑体测批次' : '新增体测批次'" width="560px" destroy-on-close>
    <el-form :model="form" label-width="100px">
      <el-form-item label="所属计划ID"><el-input-number v-model="form.planId" :min="1" style="width:100%" /></el-form-item>
      <el-form-item label="批次名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="日期"><el-date-picker v-model="form.batchDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="待开始" value="pending" />
          <el-option label="进行中" value="ongoing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </el-form-item>
      <el-form-item label="班级ID"><el-input v-model="form.classIds" placeholder="多个用逗号分隔，如：1,2,3" /></el-form-item>
      <el-form-item label="场地ID"><el-input-number v-model="form.venueId" :min="1" style="width:100%" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="form.notes" type="textarea" :rows="3" /></el-form-item>
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
const planIdFilter = ref<number | undefined>(undefined);
const statusFilter = ref('');
const loading = ref(false);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const form = ref({ planId: 1, name: '', batchDate: '', status: 'pending', classIds: '', venueId: 1, notes: '' });

function statusLabel(s: string) {
  const m: Record<string, string> = { pending: '待开始', ongoing: '进行中', completed: '已完成', cancelled: '已取消' };
  return m[s] || s;
}

function statusTagType(s: string) {
  const m: Record<string, string> = { pending: 'info', ongoing: 'warning', completed: 'success', cancelled: 'danger' };
  return m[s] || '';
}

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/exam-batches', { params: { page: page.value, size: size.value, planId: planIdFilter.value, status: statusFilter.value } });
    rows.value = data.rows;
    total.value = data.total;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  form.value = { planId: 1, name: '', batchDate: '', status: 'pending', classIds: '', venueId: 1, notes: '' };
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = {
    planId: row.planId,
    name: row.name,
    batchDate: row.batchDate || '',
    status: row.status || 'pending',
    classIds: Array.isArray(row.classIds) ? row.classIds.join(',') : (row.classIds || ''),
    venueId: row.venueId ?? 1,
    notes: row.notes || '',
  };
  dialogVisible.value = true;
}

function parseIds(str: string): number[] {
  return str.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = { ...form.value, classIds: parseIds(form.value.classIds) };
    if (editingId.value) {
      await request.put(`/exam-batches/${editingId.value}`, payload);
      ElMessage.success('更新成功');
    } else {
      await request.post('/exam-batches', payload);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此体测批次？', '提示', { type: 'warning' });
  await request.delete(`/exam-batches/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
