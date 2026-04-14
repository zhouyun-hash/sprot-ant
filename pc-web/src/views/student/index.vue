<template>
  <div class="student-page">
    <el-card class="tree-card" shadow="never">
      <template #header>
        <div class="tree-header">学校-年级-班级</div>
      </template>
      <el-tree
        :data="treeData"
        node-key="key"
        :props="{ label: 'label', children: 'children' }"
        default-expand-all
        highlight-current
        @current-change="handleTreeChange"
      />
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="toolbar">
          <el-form :inline="true">
            <el-form-item>
              <el-input v-model="query.name" placeholder="按姓名筛选" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="query.studentNo" placeholder="按学号筛选" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="query.gender" placeholder="按性别筛选" clearable style="width: 140px">
                <el-option :value="1" label="男" />
                <el-option :value="2" label="女" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="query.gradeId" placeholder="按年级筛选" clearable style="width: 180px">
                <el-option v-for="g in gradeOptions" :key="g.id" :label="g.name" :value="g.id" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="query.classId" placeholder="按班级筛选" clearable style="width: 220px">
                <el-option v-for="c in classOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onSearch">查询</el-button>
              <el-button @click="onReset">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="toolbar-actions">
            <el-upload
              :show-file-list="false"
              accept=".xlsx,.xls"
              :http-request="handleImport"
              :disabled="!canCreateOrImport"
            >
              <el-button :disabled="!canCreateOrImport">批量导入</el-button>
            </el-upload>
            <el-button type="primary" :disabled="!canCreateOrImport" @click="openCreate">新增学生</el-button>
          </div>
        </div>
      </template>

      <el-table :data="rows" stripe>
        <el-table-column prop="studentNo" label="学号" min-width="120" />
        <el-table-column label="姓名" min-width="120">
          <template #default="{ row }">{{ row.user?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="性别" width="90">
          <template #default="{ row }">{{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '-' }}</template>
        </el-table-column>
        <el-table-column label="年级" min-width="120">
          <template #default="{ row }">{{ row.classInfo?.grade || '-' }}</template>
        </el-table-column>
        <el-table-column label="班级" min-width="150">
          <template #default="{ row }">{{ row.classInfo?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="parentPhone" label="家长手机" min-width="140" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-popconfirm title="确认删除该学生？" @confirm="removeRow(row.id)">
                <template #reference><el-button link type="danger">删除</el-button></template>
              </el-popconfirm>
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
  </div>

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑学生' : '新增学生'" width="540px">
    <el-form label-width="92px">
      <el-form-item label="学号"><el-input v-model="form.studentNo" /></el-form-item>
      <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="班级">
        <el-select
          v-model="form.classId"
          style="width: 100%"
          placeholder="请选择班级"
          :disabled="!form.id && canCreateOrImport"
        >
          <el-option v-for="c in dialogClassOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="家长手机"><el-input v-model="form.parentPhone" /></el-form-item>
      <el-form-item label="性别">
        <el-select v-model="form.gender" clearable placeholder="请选择性别" style="width: 100%">
          <el-option :value="1" label="男" />
          <el-option :value="2" label="女" />
        </el-select>
      </el-form-item>
      <el-form-item label="出生日期">
        <el-date-picker
          v-model="form.birthDate"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadRequestOptions } from 'element-plus';
import request from '@/utils/request';

type ScopeType = 'all' | 'school' | 'grade' | 'class';
type TreeNodeData = {
  key: string;
  label: string;
  type: ScopeType;
  schoolId?: number;
  gradeId?: number;
  classId?: number;
  children?: TreeNodeData[];
};

const rows = ref<any[]>([]);
const total = ref(0);
const schools = ref<any[]>([]);
const gradeOptions = ref<any[]>([]);
const classOptions = ref<any[]>([]);
const treeData = ref<TreeNodeData[]>([]);
const selectedNode = ref<TreeNodeData | null>(null);

const query = reactive<any>({
  page: 1,
  pageSize: 10,
  name: '',
  studentNo: '',
  gender: undefined,
  gradeId: undefined,
  classId: undefined,
});
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<any>({
  id: null,
  studentNo: '',
  name: '',
  classId: undefined,
  parentPhone: '',
  gender: undefined,
  birthDate: '',
});

const canCreateOrImport = computed(() => selectedNode.value?.type === 'class');
const dialogClassOptions = computed(() => {
  if (!form.id && canCreateOrImport.value && selectedNode.value?.classId) {
    const current = classOptions.value.find(
      (c: any) => Number(c.id) === Number(selectedNode.value?.classId),
    );
    return current ? [current] : [];
  }
  return classOptions.value;
});

function applyNodeScope(params: Record<string, unknown>) {
  if (!selectedNode.value) return;
  if (selectedNode.value.type === 'school' && selectedNode.value.schoolId) {
    params.schoolId = selectedNode.value.schoolId;
  }
  if (selectedNode.value.type === 'grade' && selectedNode.value.gradeId) {
    params.gradeId = selectedNode.value.gradeId;
  }
  if (selectedNode.value.type === 'class' && selectedNode.value.classId) {
    params.classId = selectedNode.value.classId;
  }
}

async function load() {
  const params: Record<string, unknown> = {
    page: query.page,
    pageSize: query.pageSize,
  };
  applyNodeScope(params);
  if (query.name?.trim()) params.name = query.name.trim();
  if (query.studentNo?.trim()) params.studentNo = query.studentNo.trim();
  if (query.gender) params.gender = query.gender;
  if (query.gradeId) params.gradeId = query.gradeId;
  if (query.classId) params.classId = query.classId;

  const res = await request.get('/students', { params });
  rows.value = res.data?.items || [];
  total.value = Number(res.data?.total || 0);
}

async function loadTreeAndFilterOptions() {
  const schoolRes = await request.get('/schools', { params: { page: 1, size: 100 } });
  schools.value = schoolRes.data?.rows || [];
  const tree: TreeNodeData[] = [];
  const allGrades: any[] = [];
  const allClasses: any[] = [];

  for (const s of schools.value) {
    const gradeRes = await request.get('/grades', {
      params: { page: 1, size: 100, schoolId: s.id },
    });
    const grades = gradeRes.data?.rows || [];
    allGrades.push(...grades);
    const gradeNodes: TreeNodeData[] = [];

    for (const g of grades) {
      const classRes = await request.get('/classes', {
        params: { page: 1, pageSize: 100, schoolId: s.id, gradeId: g.id },
      });
      const classes = classRes.data?.items || [];
      allClasses.push(...classes);
      const classNodes = classes.map(
        (c: any): TreeNodeData => ({
          key: `class-${c.id}`,
          label: c.name,
          type: 'class',
          schoolId: s.id,
          gradeId: g.id,
          classId: c.id,
        }),
      );
      gradeNodes.push({
        key: `grade-${g.id}`,
        label: g.name,
        type: 'grade',
        schoolId: s.id,
        gradeId: g.id,
        children: classNodes,
      });
    }

    tree.push({
      key: `school-${s.id}`,
      label: s.name,
      type: 'school',
      schoolId: s.id,
      children: gradeNodes,
    });
  }

  treeData.value = tree;
  gradeOptions.value = allGrades;
  classOptions.value = allClasses;
}

async function handleTreeChange(data?: TreeNodeData) {
  selectedNode.value = data || null;
  query.page = 1;
  await load();
}

async function onSearch() {
  query.page = 1;
  await load();
}

async function onReset() {
  Object.assign(query, {
    page: 1,
    pageSize: 10,
    name: '',
    studentNo: '',
    gender: undefined,
    gradeId: undefined,
    classId: undefined,
  });
  await load();
}

function openCreate() {
  if (!canCreateOrImport.value || !selectedNode.value?.classId) {
    ElMessage.warning('请先在左侧选择班级节点');
    return;
  }
  Object.assign(form, {
    id: null,
    studentNo: '',
    name: '',
    classId: selectedNode.value.classId,
    parentPhone: '',
    gender: undefined,
    birthDate: '',
  });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  Object.assign(form, {
    id: row.id,
    studentNo: row.studentNo || '',
    name: row.user?.name || '',
    classId: row.classId,
    parentPhone: row.parentPhone || '',
    gender: row.gender ?? undefined,
    birthDate: row.birthDate || '',
  });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.studentNo?.trim()) {
    ElMessage.warning('请输入学号');
    return;
  }
  if (!form.name?.trim()) {
    ElMessage.warning('请输入姓名');
    return;
  }
  if (!form.classId) {
    ElMessage.warning('请选择班级');
    return;
  }
  saving.value = true;
  const payload: any = {
    studentNo: form.studentNo,
    name: form.name,
    classId: Number(form.classId),
    parentPhone: form.parentPhone || undefined,
    gender: form.gender ?? undefined,
    birthDate: form.birthDate || undefined,
  };
  try {
    if (form.id) await request.put(`/students/${form.id}`, payload);
    else await request.post('/students', payload);
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function removeRow(id: number) {
  await request.delete(`/students/${id}`);
  ElMessage.success('删除成功');
  await load();
}

async function handleImport(options: UploadRequestOptions) {
  if (!canCreateOrImport.value) {
    ElMessage.warning('请先在左侧选择班级节点');
    options.onError?.(new Error('未选择班级节点'));
    return;
  }
  const formData = new FormData();
  formData.append('file', options.file);
  try {
    await request.post('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    ElMessage.success('导入成功');
    await load();
    options.onSuccess?.({});
  } catch (error: any) {
    options.onError?.(error);
    throw error;
  }
}

onMounted(async () => {
  await loadTreeAndFilterOptions();
  await load();
});
</script>

<style scoped>
.student-page {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 12px;
}

.tree-card {
  min-height: calc(100vh - 140px);
}

.tree-header {
  font-weight: 600;
}

.table-card {
  min-width: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
