<template>
  <div class="prescription">
    <el-card class="page-card">
      <template #header>
        <div class="toolbar">
          <el-space>
            <el-input v-model="query.keyword" placeholder="搜索标题/学生" clearable style="width: 200px" @change="load" />
            <el-select v-model="query.status" placeholder="状态筛选" clearable style="width: 140px" @change="load">
              <el-option label="进行中" value="active" />
              <el-option label="已完成" value="completed" />
              <el-option label="已暂停" value="paused" />
              <el-option label="待开始" value="pending" />
            </el-select>
            <el-button type="primary" @click="load">查询</el-button>
          </el-space>
          <el-button type="primary" @click="openForm()">新增处方</el-button>
        </div>
      </template>

      <el-table :data="rows" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="studentId" label="学生ID" width="90" />
        <el-table-column prop="studentName" label="学生姓名" width="110" />
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长(天)" width="90" />
        <el-table-column prop="startDate" label="开始日期" width="120" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openForm(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          background
          layout="total, prev, pager, next"
          :total="total"
          @current-change="load"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑运动处方' : '新增运动处方'" width="520px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="学生ID">
          <el-input-number v-model="form.studentId" :min="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="运动处方标题" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="力量训练" value="力量训练" />
            <el-option label="耐力训练" value="耐力训练" />
            <el-option label="柔韧训练" value="柔韧训练" />
            <el-option label="速度训练" value="速度训练" />
            <el-option label="综合训练" value="综合训练" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="active" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="时长(天)">
          <el-input-number v-model="form.duration" :min="1" :max="365" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="内容描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

interface Prescription {
  id: number;
  studentId: number;
  studentName: string;
  title: string;
  category: string;
  status: string;
  duration: number;
  startDate: string;
  description?: string;
}

const statusMap: Record<string, { label: string; type: string }> = {
  active: { label: '进行中', type: 'success' },
  completed: { label: '已完成', type: 'info' },
  paused: { label: '已暂停', type: 'warning' },
  pending: { label: '待开始', type: '' },
};

const rows = ref<Prescription[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ page: 1, pageSize: 10, keyword: '', status: '' });

const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const form = reactive<Partial<Prescription>>({});

function resetForm() {
  Object.assign(form, {
    id: undefined,
    studentId: undefined,
    studentName: '',
    title: '',
    category: '综合训练',
    status: 'pending',
    duration: 30,
    startDate: '',
    description: '',
  });
}

function openForm(row?: Prescription) {
  resetForm();
  if (row) {
    isEdit.value = true;
    Object.assign(form, { ...row });
  } else {
    isEdit.value = false;
  }
  dialogVisible.value = true;
}

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: query.page, pageSize: query.pageSize };
    if (query.keyword) params.keyword = query.keyword;
    if (query.status) params.status = query.status;
    const res = await request.get('/exercise-prescriptions', { params });
    rows.value = res.data?.items || [];
    total.value = Number(res.data?.total || 0);
  } catch {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = {
      studentId: form.studentId,
      title: form.title,
      category: form.category,
      status: form.status,
      duration: form.duration,
      startDate: form.startDate,
      description: form.description,
    };
    if (isEdit.value && form.id) {
      await request.put(`/exercise-prescriptions/${form.id}`, payload);
    } else {
      await request.post('/exercise-prescriptions', payload);
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    await load();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该运动处方吗？', '确认', { type: 'warning' });
    await request.delete(`/exercise-prescriptions/${id}`);
    ElMessage.success('删除成功');
    await load();
  } catch {
    // cancelled
  }
}

onMounted(load);
</script>

<style scoped>
.prescription {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
