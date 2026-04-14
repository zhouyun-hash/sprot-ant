<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>班级管理</span>
        <div>
          <el-select
            v-if="isGlobalAdmin"
            v-model="filterSchoolId"
            placeholder="按学校筛选"
            clearable
            style="width: 180px; margin-right: 10px"
            @change="onFilterSchoolChange"
          >
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-select
            v-model="filterGradeId"
            placeholder="按年级筛选"
            clearable
            style="width: 180px; margin-right: 10px"
            @change="load"
          >
            <el-option v-for="g in gradeOptions" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增班级</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe>
      <el-table-column prop="name" label="班级名称" min-width="140" />
      <el-table-column prop="classNo" label="班级编号" width="120" />
      <el-table-column label="学校" min-width="140">
        <template #default="{ row }">{{ row.school?.name || '-' }}</template>
      </el-table-column>
      <el-table-column label="年级" width="140">
        <template #default="{ row }">{{ row.gradeInfo?.name || row.grade || '-' }}</template>
      </el-table-column>
      <el-table-column label="班主任" width="150">
        <template #default="{ row }">{{ row.headTeacher?.user?.name || '-' }}</template>
      </el-table-column>
      <el-table-column label="体育老师" width="150">
        <template #default="{ row }">{{ row.peTeacher?.user?.name || '-' }}</template>
      </el-table-column>
      <el-table-column prop="studentCount" label="学生数" width="100" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-space>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确认删除该班级？" @confirm="removeRow(row.id)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
            <el-button link @click="openStudents(row)">查看学生</el-button>
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

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑班级' : '新增班级'" width="560px">
    <el-form label-width="100px">
      <el-form-item label="所属学校" required>
        <el-select
          v-model="form.schoolId"
          style="width: 100%"
          placeholder="请选择学校"
          :disabled="!!form.id || (!isGlobalAdmin && !!defaultSchoolId)"
          @change="onFormSchoolChange"
        >
          <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属年级" required>
        <el-select v-model="form.gradeId" style="width: 100%" placeholder="请选择年级">
          <el-option v-for="g in formGradeOptions" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="班级名称" required><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="班级编号" required><el-input v-model="form.classNo" /></el-form-item>
      <el-form-item label="班主任" required>
        <el-select
          v-model="form.headTeacherId"
          style="width: 100%"
          placeholder="请选择班主任"
          filterable
        >
          <el-option
            v-for="teacher in teacherOptions"
            :key="teacher.id"
            :label="teacher.user?.name || teacher.teacherNo"
            :value="teacher.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="体育老师" required>
        <el-select
          v-model="form.peTeacherId"
          style="width: 100%"
          placeholder="请选择体育老师"
          filterable
        >
          <el-option
            v-for="teacher in teacherOptions"
            :key="teacher.id"
            :label="teacher.user?.name || teacher.teacherNo"
            :value="teacher.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="studentsVisible" :title="`班级学生 - ${currentClassName}`" width="780px">
    <el-table :data="studentRows" stripe>
      <el-table-column prop="studentNo" label="学号" width="140" />
      <el-table-column label="姓名">
        <template #default="{ row }">{{ row.user?.name || '-' }}</template>
      </el-table-column>
      <el-table-column prop="parentPhone" label="家长手机" width="160" />
      <el-table-column prop="gender" label="性别" width="80">
        <template #default="{ row }">
          {{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '-' }}
        </template>
      </el-table-column>
    </el-table>
    <div class="pager">
      <el-pagination
        v-model:current-page="studentQuery.page"
        v-model:page-size="studentQuery.pageSize"
        background
        layout="total, prev, pager, next"
        :total="studentTotal"
        @current-change="loadStudents"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const role = computed(() => userStore.user?.role || '');
const isGlobalAdmin = computed(() =>
  ['admin', 'super_admin', 'group_admin'].includes(role.value),
);

const rows = ref<any[]>([]);
const total = ref(0);
const query = reactive({ page: 1, pageSize: 10 });
const schools = ref<{ id: number; name: string }[]>([]);
const gradeOptions = ref<any[]>([]);
const teacherOptions = ref<any[]>([]);
const filterSchoolId = ref<number | undefined>(undefined);
const filterGradeId = ref<number | undefined>(undefined);
const defaultSchoolId = ref<number | undefined>(undefined);

const dialogVisible = ref(false);
const form = reactive<any>({
  id: null,
  schoolId: undefined as number | undefined,
  gradeId: undefined as number | undefined,
  name: '',
  classNo: '',
  headTeacherId: undefined as number | undefined,
  peTeacherId: undefined as number | undefined,
});
const formGradeOptions = ref<any[]>([]);
const saving = ref(false);

const studentsVisible = ref(false);
const currentClassId = ref<number | null>(null);
const currentClassName = ref('');
const studentRows = ref<any[]>([]);
const studentTotal = ref(0);
const studentQuery = reactive({ page: 1, pageSize: 10 });

async function loadSchools() {
  try {
    const res = await request.get('/schools', { params: { page: 1, size: 100 } });
    schools.value = (res.data?.rows || []).map((s: any) => ({ id: s.id, name: s.name }));
  } catch {
    schools.value = [];
  }
}

async function loadDefaultTeacherSchool() {
  if (isGlobalAdmin.value) return;
  const res = await request.get('/teachers', { params: { page: 1, pageSize: 1 } });
  const first = (res.data?.items || [])[0];
  if (first?.schoolId) {
    defaultSchoolId.value = Number(first.schoolId);
    filterSchoolId.value = Number(first.schoolId);
  }
}

async function loadGrades(schoolId?: number) {
  const params: Record<string, unknown> = { page: 1, size: 100 };
  if (schoolId) params.schoolId = schoolId;
  const res = await request.get('/grades', { params });
  return res.data?.rows || [];
}

async function loadTeachers(schoolId?: number) {
  const params: Record<string, unknown> = { page: 1, pageSize: 100 };
  if (schoolId) params.schoolId = schoolId;
  const res = await request.get('/teachers', { params });
  teacherOptions.value = res.data?.items || [];
}

async function fetchStudentCount(classId: number) {
  const res = await request.get(`/classes/${classId}/students`, { params: { page: 1, pageSize: 1 } });
  return Number(res.data?.total || 0);
}

async function load() {
  const params: Record<string, unknown> = { page: query.page, pageSize: query.pageSize };
  if (isGlobalAdmin.value && filterSchoolId.value) {
    params.schoolId = filterSchoolId.value;
  }
  if (filterGradeId.value) {
    params.gradeId = filterGradeId.value;
  }
  const res = await request.get('/classes', { params });
  const items = res.data?.items || [];
  total.value = Number(res.data?.total || 0);
  const counts = await Promise.all(items.map((item: any) => fetchStudentCount(item.id)));
  rows.value = items.map((item: any, index: number) => ({ ...item, studentCount: counts[index] || 0 }));
}

async function onFilterSchoolChange() {
  filterGradeId.value = undefined;
  gradeOptions.value = await loadGrades(filterSchoolId.value);
  await load();
}

async function onFormSchoolChange(schoolId: number) {
  form.gradeId = undefined;
  form.headTeacherId = undefined;
  form.peTeacherId = undefined;
  formGradeOptions.value = await loadGrades(schoolId);
  await loadTeachers(schoolId);
}

async function openCreate() {
  Object.assign(form, {
    id: null,
    schoolId: isGlobalAdmin.value ? filterSchoolId.value || schools.value[0]?.id : defaultSchoolId.value,
    gradeId: undefined,
    name: '',
    classNo: '',
    headTeacherId: undefined,
    peTeacherId: undefined,
  });
  formGradeOptions.value = await loadGrades(form.schoolId);
  await loadTeachers(form.schoolId);
  dialogVisible.value = true;
}

async function openEdit(row: any) {
  Object.assign(form, {
    id: row.id,
    schoolId: row.schoolId,
    gradeId: row.gradeId,
    name: row.name,
    classNo: row.classNo || '',
    headTeacherId: row.headTeacherId ?? undefined,
    peTeacherId: row.peTeacherId ?? undefined,
  });
  formGradeOptions.value = await loadGrades(form.schoolId);
  await loadTeachers(form.schoolId);
  dialogVisible.value = true;
}

async function submit() {
  if (!form.schoolId) return ElMessage.warning('请选择学校');
  if (!form.gradeId) return ElMessage.warning('请选择年级');
  if (!form.name?.trim()) return ElMessage.warning('请输入班级名称');
  if (!form.classNo?.trim()) return ElMessage.warning('请输入班级编号');
  if (!form.headTeacherId) return ElMessage.warning('请选择班主任');
  if (!form.peTeacherId) return ElMessage.warning('请选择体育老师');

  saving.value = true;
  const payload: any = {
    schoolId: Number(form.schoolId),
    gradeId: Number(form.gradeId),
    name: form.name.trim(),
    classNo: form.classNo.trim(),
    headTeacherId: Number(form.headTeacherId),
    peTeacherId: Number(form.peTeacherId),
    teacherId: Number(form.headTeacherId),
    schoolYear: new Date().getFullYear().toString(),
  };
  try {
    if (form.id) await request.put(`/classes/${form.id}`, payload);
    else await request.post('/classes', payload);
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function removeRow(id: number) {
  await request.delete(`/classes/${id}`);
  ElMessage.success('删除成功');
  await load();
}

async function openStudents(row: any) {
  currentClassId.value = row.id;
  currentClassName.value = row.name || '';
  studentQuery.page = 1;
  studentsVisible.value = true;
  await loadStudents();
}

async function loadStudents() {
  if (!currentClassId.value) return;
  const res = await request.get(`/classes/${currentClassId.value}/students`, {
    params: { page: studentQuery.page, pageSize: studentQuery.pageSize },
  });
  studentRows.value = res.data?.items || [];
  studentTotal.value = Number(res.data?.total || 0);
}

onMounted(async () => {
  await loadSchools();
  await loadDefaultTeacherSchool();
  gradeOptions.value = await loadGrades(filterSchoolId.value || defaultSchoolId.value);
  await load();
});
</script>
