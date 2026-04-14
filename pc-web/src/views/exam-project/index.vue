<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>体测项目管理</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索项目名称" clearable style="width:200px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="categoryFilter" placeholder="分类" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="耐力" value="耐力" />
            <el-option label="速度" value="速度" />
            <el-option label="力量" value="力量" />
            <el-option label="柔韧" value="柔韧" />
            <el-option label="灵敏" value="灵敏" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增项目</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="项目名称" min-width="140" />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="scoreType" label="计分方式" width="120">
        <template #default="{ row }">
          {{ examProjectScoreTypeLabel(row.scoreType) }}
        </template>
      </el-table-column>
      <el-table-column label="启用" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" @change="handleToggle(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" :type="row.enabled ? 'warning' : 'success'" @click="handleToggle(row)">{{ row.enabled ? '停用' : '启用' }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑体测项目' : '新增体测项目'" width="560px" destroy-on-close>
    <el-form :model="form" label-width="90px">
      <el-form-item label="项目名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category" style="width:100%">
          <el-option label="耐力" value="耐力" />
          <el-option label="速度" value="速度" />
          <el-option label="力量" value="力量" />
          <el-option label="柔韧" value="柔韧" />
          <el-option label="灵敏" value="灵敏" />
        </el-select>
      </el-form-item>
      <el-form-item label="单位"><el-input v-model="form.unit" placeholder="如：秒、米、次" /></el-form-item>
      <el-form-item label="计分方式">
        <el-select v-model="form.scoreType" style="width:100%">
          <el-option
            v-for="opt in EXAM_PROJECT_SCORE_TYPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
      <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
      <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
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
import {
  ExamProjectScoreType,
  EXAM_PROJECT_SCORE_TYPE_OPTIONS,
  examProjectScoreTypeLabel,
} from '@/constants/examProjectScoreType';

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const keyword = ref('');
const categoryFilter = ref('');
const loading = ref(false);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const form = ref({
  name: '',
  category: '',
  unit: '',
  scoreType: ExamProjectScoreType.Count as string,
  description: '',
  enabled: true,
  sortOrder: 0,
});

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/exam-projects', { params: { page: page.value, size: size.value, keyword: keyword.value, category: categoryFilter.value } });
    rows.value = data.rows;
    total.value = data.total;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  form.value = { name: '', category: '', unit: '', scoreType: '', description: '', enabled: true, sortOrder: 0 };
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = { name: row.name, category: row.category || '', unit: row.unit || '', scoreType: row.scoreType || '', description: row.description || '', enabled: !!row.enabled, sortOrder: row.sortOrder ?? 0 };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/exam-projects/${editingId.value}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await request.post('/exam-projects', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally { saving.value = false; }
}

async function handleToggle(row: any) {
  await request.put(`/exam-projects/${row.id}`, { enabled: row.enabled });
  ElMessage.success(row.enabled ? '已启用' : '已停用');
  await load();
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此体测项目？', '提示', { type: 'warning' });
  await request.delete(`/exam-projects/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
