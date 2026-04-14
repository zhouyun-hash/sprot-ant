<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>作业管理</span>
        <el-button type="primary" @click="openCreate">新建作业</el-button>
      </div>
    </template>

    <el-table :data="rows" stripe>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="description" label="描述" min-width="220" />
      <el-table-column prop="deadline" label="截止日期" width="180" />
      <el-table-column label="班级" min-width="220">
        <template #default="{ row }">
          {{ formatClassNames(row.classIds) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-space>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确认删除该作业？" @confirm="removeRow(row.id)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
            <el-button link @click="viewSubmissions(row.id)">查看提交</el-button>
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

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑作业' : '新建作业'" width="620px">
    <el-form label-width="100px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
      <el-form-item label="截止日期">
        <el-date-picker v-model="form.deadline" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
      </el-form-item>
      <el-form-item label="选择班级">
        <el-select v-model="form.classIds" multiple collapse-tags collapse-tags-tooltip style="width: 100%" placeholder="请选择班级">
          <el-option v-for="c in classOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const router = useRouter();

const rows = ref<any[]>([]);
const total = ref(0);
const classOptions = ref<any[]>([]);
const query = reactive({ page: 1, pageSize: 10 });

const dialogVisible = ref(false);
const form = reactive<any>({
  id: null,
  title: '',
  description: '',
  deadline: '',
  classIds: [] as number[],
});

async function loadClasses() {
  const res = await request.get('/classes', { params: { page: 1, pageSize: 500 } });
  classOptions.value = res.data?.items || [];
}

async function load() {
  const res = await request.get('/homework', { params: { page: query.page, pageSize: query.pageSize } });
  rows.value = res.data?.items || [];
  total.value = Number(res.data?.total || 0);
}

function formatClassNames(classIds?: number[]) {
  if (!Array.isArray(classIds) || !classIds.length) return '-';
  const idSet = new Set(classIds.map((id) => Number(id)));
  const names = classOptions.value.filter((c) => idSet.has(Number(c.id))).map((c) => c.name);
  return names.length ? names.join('、') : classIds.join(',');
}

function openCreate() {
  Object.assign(form, { id: null, title: '', description: '', deadline: '', classIds: [] });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  Object.assign(form, {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    deadline: row.deadline?.slice?.(0, 19) || '',
    classIds: Array.isArray(row.classIds) ? row.classIds : [],
  });
  dialogVisible.value = true;
}

async function submit() {
  const payload: any = {
    title: form.title,
    description: form.description || undefined,
    deadline: form.deadline,
    classIds: form.classIds,
  };
  if (form.id) await request.put(`/homework/${form.id}`, payload);
  else await request.post('/homework', payload);
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  await load();
}

async function removeRow(id: number) {
  await request.delete(`/homework/${id}`);
  ElMessage.success('删除成功');
  await load();
}

function viewSubmissions(homeworkId: number) {
  router.push(`/homework/${homeworkId}/submissions`);
}

onMounted(async () => {
  await loadClasses();
  await load();
});
</script>
