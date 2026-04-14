<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <el-space>
          <el-button @click="goBack">返回任务列表</el-button>
          <span>任务成绩详情（Task ID: {{ taskId || '-' }}）</span>
        </el-space>
        <el-space>
          <el-select v-model="query.classId" clearable placeholder="按班级筛选" style="width: 220px">
            <el-option v-for="c in classOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-button @click="load">查询</el-button>
          <el-button type="primary" @click="exportExcel">导出Excel</el-button>
        </el-space>
      </div>
    </template>

    <el-table :data="tableRows" stripe>
      <el-table-column prop="studentName" label="学生姓名" width="140" />
      <el-table-column prop="className" label="班级" width="180" />
      <el-table-column
        v-for="project in projectColumns"
        :key="project"
        :label="project"
        min-width="120"
      >
        <template #default="{ row }">
          <span class="editable-cell" @dblclick="openEdit(row, project)">
            {{ row.projectMap?.[project]?.result ?? '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button link type="primary" @click="openFirstEditable(row)">修改</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="editVisible" title="修改成绩" width="420px">
    <el-form label-width="90px">
      <el-form-item label="学生"><span>{{ editForm.studentName }}</span></el-form-item>
      <el-form-item label="项目"><span>{{ editForm.project }}</span></el-form-item>
      <el-form-item label="成绩">
        <el-input v-model="editForm.result" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editVisible = false">取消</el-button>
      <el-button type="primary" @click="saveEdit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();
const taskId = Number(route.params.taskId || route.query.taskId || 0);

const query = reactive<any>({ classId: undefined });
const rawRows = ref<any[]>([]);
const classOptions = ref<any[]>([]);
const preferredProjectOrder = ['跳绳', '仰卧起坐', '立定跳远', '跑步'];

const editVisible = ref(false);
const editForm = reactive<any>({
  scoreId: null,
  studentName: '',
  project: '',
  result: '',
  unit: '',
});

const projectColumns = computed(() => {
  const set = new Set<string>();
  for (const row of rawRows.value) {
    if (row.project) set.add(String(row.project));
  }
  const dynamic = Array.from(set);
  const ordered = preferredProjectOrder.filter((p) => set.has(p));
  const remain = dynamic.filter((p) => !preferredProjectOrder.includes(p)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  return [...ordered, ...remain];
});

const tableRows = computed(() => {
  const map = new Map<number, any>();
  for (const score of rawRows.value) {
    const sid = Number(score.student?.id || score.studentId || 0);
    if (!sid) continue;
    if (!map.has(sid)) {
      map.set(sid, {
        studentId: sid,
        studentName: score.student?.user?.name || '-',
        className: score.student?.classInfo?.name || '-',
        projectMap: {},
      });
    }
    const row = map.get(sid);
    row.projectMap[String(score.project)] = {
      scoreId: score.id,
      project: score.project,
      result: score.result,
      unit: score.unit,
    };
  }
  return Array.from(map.values());
});

async function loadClasses() {
  const res = await request.get('/classes', { params: { page: 1, pageSize: 500 } });
  classOptions.value = res.data?.items || [];
}

async function load() {
  if (!taskId) return;
  const params: any = { taskId, page: 1, pageSize: 1000 };
  if (query.classId) params.classId = query.classId;
  const res = await request.get('/scores', { params });
  rawRows.value = res.data?.items || [];
}

function openEdit(row: any, project: string) {
  const cell = row.projectMap?.[project];
  if (!cell) {
    ElMessage.warning('该项目暂无成绩记录');
    return;
  }
  Object.assign(editForm, {
    scoreId: cell.scoreId,
    studentName: row.studentName,
    project: cell.project,
    result: String(cell.result ?? ''),
    unit: cell.unit,
  });
  editVisible.value = true;
}

function openFirstEditable(row: any) {
  const firstProject = projectColumns.value.find((p) => row.projectMap?.[p]?.scoreId);
  if (!firstProject) {
    ElMessage.warning('该学生暂无可修改成绩');
    return;
  }
  openEdit(row, firstProject);
}

async function saveEdit() {
  if (!editForm.scoreId) return;
  await request.put(`/scores/${editForm.scoreId}`, {
    project: editForm.project,
    result: editForm.result,
    unit: editForm.unit || undefined,
  });
  ElMessage.success('修改成功');
  editVisible.value = false;
  await load();
}

async function exportExcel() {
  if (!taskId) return;
  const res = await request.get('/scores/export', {
    params: { taskId },
    responseType: 'blob',
  });
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `task-${taskId}-scores.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function goBack() {
  router.push('/tasks');
}

onMounted(async () => {
  await loadClasses();
  await load();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.editable-cell {
  cursor: pointer;
}
</style>
