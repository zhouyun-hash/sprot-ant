<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>体测任务</span>
        <el-button type="primary" @click="openCreate">新建任务</el-button>
      </div>
    </template>

    <el-table :data="rows" stripe>
      <el-table-column prop="name" label="任务名称" />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column label="参与班级">
        <template #default="{ row }">
          {{ formatClassNames(row.classIds) }}
        </template>
      </el-table-column>
      <el-table-column label="起止时间" width="280">
        <template #default="{ row }">
          {{ formatDateTime(row.startTime) }} - {{ formatDateTime(row.endTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <el-space>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确认删除该任务？" @confirm="removeRow(row.id)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
            <el-button link type="success" @click="publish(row.id)" :disabled="row.status === 'ongoing'">发布</el-button>
            <el-button link @click="viewScores(row.id)">查看成绩</el-button>
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

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑任务' : '新建任务'" width="640px">
    <el-form label-width="110px">
      <el-form-item label="任务名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" style="width: 100%">
          <el-option label="体测" value="体测" />
          <el-option label="日常练习" value="日常练习" />
        </el-select>
      </el-form-item>
      <el-form-item label="参与年级">
        <el-select v-model="form.gradeIds" multiple collapse-tags collapse-tags-tooltip style="width: 100%" placeholder="请选择年级">
          <el-option v-for="g in gradeOptions" :key="g.value" :label="g.label" :value="g.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="参与班级">
        <el-select v-model="form.classIds" multiple collapse-tags collapse-tags-tooltip style="width: 100%" placeholder="请选择班级">
          <el-option v-for="c in classOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="项目">
        <el-select v-model="form.projectIds" multiple collapse-tags collapse-tags-tooltip style="width: 100%" placeholder="请选择项目">
          <el-option v-for="p in projectOptions" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="form.timeRange"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const router = useRouter();

const rows = ref<any[]>([]);
const total = ref(0);
const query = reactive({ page: 1, pageSize: 10 });
const classOptions = ref<any[]>([]);

const projectOptions = [
  { label: '跳绳', value: 1 },
  { label: '仰卧起坐', value: 2 },
  { label: '立定跳远', value: 3 },
  { label: '跑步', value: 4 },
];

const dialogVisible = ref(false);
const form = reactive<any>({
  id: null,
  name: '',
  type: '体测',
  gradeIds: [] as number[],
  classIds: [] as number[],
  projectIds: [] as number[],
  timeRange: [] as string[],
});

const gradeOptions = computed(() => {
  const map = new Map<string, number>();
  for (const c of classOptions.value) {
    const key = String(c.grade || '').trim();
    if (key && !map.has(key)) map.set(key, Number(c.gradeId || c.id));
  }
  return Array.from(map.entries()).map(([label, value], idx) => ({ label, value: value || idx + 1 }));
});

async function loadClasses() {
  const res = await request.get('/classes', { params: { page: 1, pageSize: 500 } });
  classOptions.value = res.data?.items || [];
}

async function load() {
  const res = await request.get('/tasks', { params: { page: query.page, pageSize: query.pageSize } });
  rows.value = res.data?.items || [];
  total.value = Number(res.data?.total || 0);
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
}

function formatClassNames(classIds?: number[]) {
  if (!Array.isArray(classIds) || !classIds.length) return '-';
  const idSet = new Set(classIds.map((id) => Number(id)));
  const names = classOptions.value.filter((c) => idSet.has(Number(c.id))).map((c) => c.name);
  return names.length ? names.join('、') : classIds.join(',');
}

function openCreate() {
  Object.assign(form, {
    id: null,
    name: '',
    type: '体测',
    gradeIds: [],
    classIds: [],
    projectIds: [],
    timeRange: [],
  });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  Object.assign(form, {
    id: row.id,
    name: row.name || '',
    type: row.type || '体测',
    gradeIds: Array.isArray(row.gradeIds) ? row.gradeIds : [],
    classIds: Array.isArray(row.classIds) ? row.classIds : [],
    projectIds: Array.isArray(row.projectIds) ? row.projectIds : [],
    timeRange: [row.startTime || '', row.endTime || ''],
  });
  dialogVisible.value = true;
}

async function submit() {
  const payload = {
    name: form.name,
    type: form.type,
    gradeIds: form.gradeIds,
    classIds: form.classIds,
    projectIds: form.projectIds,
    startTime: form.timeRange?.[0],
    endTime: form.timeRange?.[1],
  };
  if (form.id) await request.put(`/tasks/${form.id}`, payload);
  else await request.post('/tasks', payload);
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  await load();
}

async function removeRow(id: number) {
  await request.delete(`/tasks/${id}`);
  ElMessage.success('删除成功');
  await load();
}

async function publish(id: number) {
  await request.post(`/tasks/${id}/publish`);
  ElMessage.success('发布成功');
  await load();
}

function viewScores(taskId: number) {
  router.push(`/tasks/${taskId}/score`);
}

onMounted(async () => {
  await loadClasses();
  await load();
});
</script>
