<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>年级管理</span>
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
          <el-input v-model="keyword" placeholder="搜索年级" clearable style="width:160px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="schoolYear" placeholder="学年" clearable style="width:140px;margin-right:10px" @change="load">
            <el-option v-for="y in years" :key="y" :label="y" :value="y" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增年级</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="学校" min-width="160">
        <template #default="{ row }">
          {{ row.school?.name || (row.schoolId ? `ID:${row.schoolId}` : '-') }}
        </template>
      </el-table-column>
      <el-table-column prop="name" label="年级名称" min-width="120" />
      <el-table-column prop="schoolYear" label="学年" width="120" />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑年级' : '新增年级'" width="520px" destroy-on-close>
    <el-form :model="form" label-width="88px">
      <el-form-item label="所属学校" required>
        <el-select v-model="form.schoolId" style="width:100%" placeholder="请选择学校" :disabled="!!editingId">
          <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <div v-if="editingId" class="form-tip">所属学校创建后不可修改，如需调整请联系管理员处理。</div>
      </el-form-item>
      <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="学年"><el-input v-model="form.schoolYear" placeholder="如 2025-2026" /></el-form-item>
      <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
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
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(50);
const keyword = ref('');
const schoolYear = ref('');
const filterSchoolId = ref<number | undefined>(undefined);
const loading = ref(false);
const schools = ref<{ id: number; name: string }[]>([]);

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => `${currentYear - 2 + i}-${currentYear - 1 + i}`);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const form = ref({ name: '', schoolYear: '', sortOrder: 0, schoolId: undefined as number | undefined });

async function loadSchools() {
  try {
    const { data } = await request.get('/schools', { params: { page: 1, size: 200 } });
    schools.value = (data.rows || []).map((s: any) => ({ id: s.id, name: s.name }));
  } catch {
    schools.value = [];
  }
}

async function load() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: page.value,
      size: size.value,
      keyword: keyword.value,
      schoolYear: schoolYear.value,
    };
    if (userStore.isAdmin && filterSchoolId.value) {
      params.schoolId = filterSchoolId.value;
    }
    const { data } = await request.get('/grades', { params });
    rows.value = data.rows;
    total.value = data.total;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  form.value = {
    name: '',
    schoolYear: `${currentYear}-${currentYear + 1}`,
    sortOrder: 0,
    schoolId: filterSchoolId.value || schools.value[0]?.id,
  };
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = {
    name: row.name,
    schoolYear: row.schoolYear,
    sortOrder: row.sortOrder,
    schoolId: row.schoolId,
  };
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入年级名称');
    return;
  }
  if (!form.value.schoolYear.trim()) {
    ElMessage.warning('请输入学年');
    return;
  }
  if (!form.value.schoolId) {
    ElMessage.warning('请选择所属学校');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/grades/${editingId.value}`, {
        name: form.value.name,
        schoolYear: form.value.schoolYear,
        sortOrder: form.value.sortOrder,
      });
      ElMessage.success('更新成功');
    } else {
      await request.post('/grades', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此年级？', '提示', { type: 'warning' });
  await request.delete(`/grades/${id}`);
  ElMessage.success('已删除');
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
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
