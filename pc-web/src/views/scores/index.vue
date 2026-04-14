<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <el-space>
          <el-input-number v-model="query.taskId" :min="1" placeholder="任务ID" controls-position="right" />
          <el-input-number v-model="query.studentId" :min="1" placeholder="学生ID" controls-position="right" />
          <el-button type="primary" @click="load">查询</el-button>
        </el-space>
      </div>
    </template>

    <el-table :data="rows" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="task.id" label="任务ID" width="90" />
      <el-table-column prop="student.user.name" label="学生" />
      <el-table-column prop="project" label="项目" />
      <el-table-column prop="result" label="成绩" />
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="reviewStatus" label="复核状态" width="100" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-space>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="success" @click="openReview(row)">复核</el-button>
          </el-space>
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

  <el-dialog v-model="editVisible" title="编辑成绩" width="420px">
    <el-form label-width="90px">
      <el-form-item label="项目"><el-input v-model="editForm.project" /></el-form-item>
      <el-form-item label="成绩"><el-input v-model="editForm.result" /></el-form-item>
      <el-form-item label="单位"><el-input v-model="editForm.unit" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editVisible = false">取消</el-button>
      <el-button type="primary" @click="saveEdit">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="reviewVisible" title="人工复核" width="420px">
    <el-form label-width="90px">
      <el-form-item label="复核状态">
        <el-select v-model="reviewForm.reviewStatus" style="width: 100%">
          <el-option label="待复核" value="pending" />
          <el-option label="通过" value="approved" />
          <el-option label="驳回" value="rejected" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注"><el-input v-model="reviewForm.reviewRemark" type="textarea" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="reviewVisible = false">取消</el-button>
      <el-button type="primary" @click="saveReview">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const rows = ref<any[]>([]);
const total = ref(0);
const query = reactive<any>({ page: 1, pageSize: 10, taskId: undefined, studentId: undefined });

const editVisible = ref(false);
const editForm = reactive<any>({ id: null, project: '', result: '', unit: '' });

const reviewVisible = ref(false);
const reviewForm = reactive<any>({ id: null, reviewStatus: 'approved', reviewRemark: '' });

async function load() {
  const params: any = { page: query.page, pageSize: query.pageSize };
  if (query.taskId) params.taskId = query.taskId;
  if (query.studentId) params.studentId = query.studentId;
  const res = await request.get('/scores', { params });
  rows.value = res.data?.items || [];
  total.value = Number(res.data?.total || 0);
}

function openEdit(row: any) {
  Object.assign(editForm, { id: row.id, project: row.project, result: row.result, unit: row.unit });
  editVisible.value = true;
}

async function saveEdit() {
  const payload = { project: editForm.project, result: editForm.result, unit: editForm.unit };
  await request.put(`/scores/${editForm.id}`, payload);
  ElMessage.success('保存成功');
  editVisible.value = false;
  await load();
}

function openReview(row: any) {
  Object.assign(reviewForm, {
    id: row.id,
    reviewStatus: row.reviewStatus || 'approved',
    reviewRemark: row.reviewRemark || '',
  });
  reviewVisible.value = true;
}

async function saveReview() {
  await request.post('/scores/review', {
    id: reviewForm.id,
    reviewStatus: reviewForm.reviewStatus,
    reviewRemark: reviewForm.reviewRemark || undefined,
  });
  ElMessage.success('复核成功');
  reviewVisible.value = false;
  await load();
}

onMounted(load);
</script>

<style scoped>
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
