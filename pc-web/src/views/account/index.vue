<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>账号管理</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索用户名/姓名" clearable style="width:200px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-button v-if="canManageAccount" type="primary" @click="openCreate">新增账号</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="roleTagType(row.role)">{{ roleLabel(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button v-if="canManageAccount" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="canManageAccount" size="small" @click="openResetPassword(row)">重置密码</el-button>
          <el-button v-if="canManageAccount" size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>

  <!-- 新增 / 编辑 -->
  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑账号' : '新增账号'" width="480px" destroy-on-close>
    <el-form :model="form" label-width="80px">
      <el-form-item v-if="!editingId" label="引用教师">
        <el-select v-model="selectedTeacherId" clearable filterable style="width:100%" placeholder="可选：从教师管理快速填充信息" @change="handleTeacherSelected">
          <el-option v-for="t in teacherOptions" :key="t.id" :label="`${t.user?.name || '-'}（${t.teacherNo || '-'}）`" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="用户名"><el-input v-model="form.username" :disabled="!!editingId" placeholder="登录时使用的用户名" /></el-form-item>
      <el-form-item v-if="!editingId" label="密码"><el-input v-model="form.password" type="password" show-password placeholder="请设置登录密码" /></el-form-item>
      <el-form-item label="姓名"><el-input v-model="form.name" placeholder="真实姓名" /></el-form-item>
      <el-form-item label="角色">
        <el-select v-model="form.role" style="width:100%" placeholder="请选择角色">
          <el-option v-for="r in availableRoles" :key="r.code" :label="r.name" :value="r.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="手机号"><el-input v-model="form.phone" placeholder="可选" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>

  <!-- 重置密码 -->
  <el-dialog v-model="resetDialogVisible" title="重置密码" width="420px" destroy-on-close>
    <el-form label-width="80px">
      <el-form-item label="账号">
        <el-input :model-value="resetTarget.username" disabled />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input v-model="resetNewPassword" type="password" show-password placeholder="请输入新密码（不填则重置为 Admin123456）" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="resetDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="resetting" @click="handleResetPassword">确认重置</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const canManageAccount = computed(() => {
  const role = userStore.user?.role;
  return role === 'admin' || role === 'super_admin';
});

interface RoleOption { id: number; name: string; code: string }
const roleOptions = ref<RoleOption[]>([]);
const teacherOptions = ref<any[]>([]);
const selectedTeacherId = ref<number | null>(null);

const availableRoles = computed(() =>
  roleOptions.value.filter((r) => r.code !== 'student' && r.code !== 'parent'),
);

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const keyword = ref('');
const loading = ref(false);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const form = ref({ username: '', password: '', name: '', role: '', phone: '' });

const resetDialogVisible = ref(false);
const resetTarget = ref<{ id: number; username: string }>({ id: 0, username: '' });
const resetNewPassword = ref('');
const resetting = ref(false);

function roleLabel(code: string) {
  const found = roleOptions.value.find((r) => r.code === code);
  return found ? found.name : code;
}

const tagTypes = ['', 'success', 'warning', 'danger', 'info'] as const;
function roleTagType(code: string) {
  const idx = roleOptions.value.findIndex((r) => r.code === code);
  return idx >= 0 ? tagTypes[idx % tagTypes.length] : 'info';
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleString('zh-CN') : '';
}

async function loadRoles() {
  try {
    const { data } = await request.get('/roles', { params: { page: 1, size: 100 } });
    roleOptions.value = (data.rows || []).map((r: any) => ({ id: r.id, name: r.name, code: r.code }));
  } catch {
    roleOptions.value = [];
  }
}

async function loadTeachers() {
  try {
    const { data } = await request.get('/teachers', { params: { page: 1, pageSize: 100 } });
    teacherOptions.value = data.items || [];
  } catch {
    teacherOptions.value = [];
  }
}

function handleTeacherSelected() {
  const teacher = teacherOptions.value.find((t) => t.id === selectedTeacherId.value);
  if (!teacher) return;
  form.value.name = teacher.user?.name || form.value.name;
  form.value.phone = teacher.user?.phone || form.value.phone;
  form.value.username = teacher.user?.username || teacher.teacherNo || form.value.username;
  const teacherRole = roleOptions.value.find((r) => r.code === 'teacher');
  if (teacherRole) {
    form.value.role = teacherRole.code;
  }
}

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/users', { params: { page: page.value, size: size.value, keyword: keyword.value } });
    rows.value = data.rows || data;
    total.value = data.total || rows.value.length;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  selectedTeacherId.value = null;
  form.value = { username: '', password: '', name: '', role: '', phone: '' };
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = { username: row.username, password: '', name: row.name, role: row.role, phone: row.phone || '' };
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.username.trim()) {
    ElMessage.warning('请输入用户名');
    return;
  }
  if (!editingId.value && !form.value.password.trim()) {
    ElMessage.warning('请输入密码');
    return;
  }
  if (!form.value.role) {
    ElMessage.warning('请选择角色');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      const { password, username, ...rest } = form.value;
      await request.put(`/users/${editingId.value}`, rest);
      ElMessage.success('更新成功');
    } else {
      await request.post('/users', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此账号？', '提示', { type: 'warning' });
  await request.delete(`/users/${id}`);
  ElMessage.success('已删除');
  await load();
}

function openResetPassword(row: any) {
  resetTarget.value = { id: row.id, username: row.username };
  resetNewPassword.value = '';
  resetDialogVisible.value = true;
}

async function handleResetPassword() {
  resetting.value = true;
  try {
    await request.put(`/users/${resetTarget.value.id}/reset-password`, {
      password: resetNewPassword.value.trim() || undefined,
    });
    ElMessage.success('密码已重置');
    resetDialogVisible.value = false;
  } finally { resetting.value = false; }
}

onMounted(async () => {
  await loadRoles();
  await loadTeachers();
  await load();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
</style>
