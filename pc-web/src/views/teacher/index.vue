<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>教师管理</span>
        <div>
          <el-select
            v-if="userStore.isAdmin"
            v-model="filterSchoolId"
            placeholder="按学校筛选"
            clearable
            style="width:200px;margin-right:10px"
            @change="load"
          >
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增教师</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe>
      <el-table-column prop="teacherNo" label="教师编号" />
      <el-table-column label="学校" min-width="140">
        <template #default="{ row }">
          {{ row.school?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="姓名">
        <template #default="{ row }">
          {{ row.user?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="手机">
        <template #default="{ row }">
          {{ row.user?.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-space>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm v-if="userStore.isAdmin" title="确认删除该教师？" @confirm="removeRow(row.id)">
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

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑教师' : '新增教师'" width="520px" destroy-on-close>
    <el-form label-width="92px">
      <el-form-item v-if="!form.id" label="所属学校" required>
        <el-select v-model="form.schoolId" style="width:100%" placeholder="请选择学校">
          <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-else-if="userStore.isAdmin" label="所属学校">
        <el-select v-model="form.schoolId" style="width:100%" placeholder="请选择学校">
          <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-else label="学校">
        <el-input :model-value="form.schoolName" disabled />
      </el-form-item>
      <el-form-item label="教师编号"><el-input v-model="form.teacherNo" /></el-form-item>
      <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="手机"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="密码">
        <el-input v-model="form.password" type="password" show-password placeholder="留空则不修改/使用默认策略" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const rows = ref<any[]>([]);
const total = ref(0);
const query = reactive({ page: 1, pageSize: 10 });
const filterSchoolId = ref<number | undefined>(undefined);
const schools = ref<{ id: number; name: string }[]>([]);

const dialogVisible = ref(false);
const form = reactive<any>({
  id: null,
  schoolId: undefined as number | undefined,
  schoolName: '',
  teacherNo: '',
  name: '',
  phone: '',
  password: '',
});
const saving = ref(false);

async function loadSchools() {
  try {
    const res = await request.get('/schools', { params: { page: 1, size: 200 } });
    schools.value = (res.data?.rows || []).map((s: any) => ({ id: s.id, name: s.name }));
  } catch {
    schools.value = [];
  }
}

async function load() {
  const params: Record<string, unknown> = { page: query.page, pageSize: query.pageSize };
  if (userStore.isAdmin && filterSchoolId.value) {
    params.schoolId = filterSchoolId.value;
  }
  const res = await request.get('/teachers', { params });
  rows.value = res.data?.items || [];
  total.value = Number(res.data?.total || 0);
}

function openCreate() {
  Object.assign(form, {
    id: null,
    schoolId: filterSchoolId.value || schools.value[0]?.id,
    schoolName: '',
    teacherNo: '',
    name: '',
    phone: '',
    password: '',
  });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  Object.assign(form, {
    id: row.id,
    schoolId: row.schoolId,
    schoolName: row.school?.name || '',
    teacherNo: row.teacherNo || '',
    name: row.user?.name || '',
    phone: row.user?.phone || '',
    password: '',
  });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.teacherNo?.trim()) {
    ElMessage.warning('请输入教师编号');
    return;
  }
  if (!form.name?.trim()) {
    ElMessage.warning('请输入姓名');
    return;
  }
  if (!form.id && !form.schoolId) {
    ElMessage.warning('请选择所属学校');
    return;
  }
  saving.value = true;
  const payload: any = {
    teacherNo: form.teacherNo,
    name: form.name,
    phone: form.phone || undefined,
  };
  if (form.password) payload.password = form.password;
  if (form.id && userStore.isAdmin && form.schoolId) {
    payload.schoolId = form.schoolId;
  }
  if (!form.id) {
    payload.schoolId = form.schoolId;
  }

  try {
    if (form.id) await request.put(`/teachers/${form.id}`, payload);
    else await request.post('/teachers', payload);
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function removeRow(id: number) {
  await request.delete(`/teachers/${id}`);
  ElMessage.success('删除成功');
  await load();
}

onMounted(async () => {
  await loadSchools();
  await load();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
</style>
