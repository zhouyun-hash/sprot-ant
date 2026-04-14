<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>角色权限管理</span>
        <el-button type="primary" @click="openCreate">新增角色</el-button>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="角色名称" width="140" />
      <el-table-column prop="code" label="角色编码" width="120" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="权限数" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ (row.permissions || []).length }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" @click="openPermissions(row)">权限</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑角色' : '新增角色'" width="480px" destroy-on-close>
    <el-form :model="form" label-width="80px">
      <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="编码">
        <el-select
          v-if="!editingId"
          v-model="form.code"
          style="width: 100%"
          placeholder="请选择角色编码"
        >
          <el-option
            v-for="opt in availableCodeOptions"
            :key="opt.value"
            :label="`${opt.label}（${opt.value}）`"
            :value="opt.value"
          />
        </el-select>
        <el-input v-else v-model="form.code" disabled />
      </el-form-item>
      <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="permVisible" title="权限配置" width="600px" destroy-on-close>
    <el-checkbox-group v-model="selectedPerms">
      <div v-for="group in permissionGroups" :key="group.label" style="margin-bottom:16px">
        <div style="font-weight:600;margin-bottom:8px;color:#1a3353">{{ group.label }}</div>
        <el-checkbox v-for="p in group.items" :key="p.value" :label="p.value">{{ p.label }}</el-checkbox>
      </div>
    </el-checkbox-group>
    <template #footer>
      <el-button @click="permVisible = false">取消</el-button>
      <el-button type="primary" @click="savePermissions">保存权限</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const SYSTEM_ROLE_CODES = [
  { value: 'admin', label: '系统管理员' },
  { value: 'super_admin', label: '超级管理员' },
  { value: 'group_admin', label: '集团管理员' },
  { value: 'school_admin', label: '学校管理员' },
  { value: 'teacher', label: '教师' },
];

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(50);
const loading = ref(false);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const form = ref({ name: '', code: '', description: '' });

const availableCodeOptions = computed(() => {
  const usedCodes = new Set(rows.value.map((r: any) => r.code));
  return SYSTEM_ROLE_CODES.filter((opt) => !usedCodes.has(opt.value));
});

const permVisible = ref(false);
const selectedPerms = ref<string[]>([]);
const permRoleId = ref<number>(0);

const permissionGroups = [
  { label: '基础管理', items: [
    { value: 'school:read', label: '查看学校' }, { value: 'school:write', label: '编辑学校' },
    { value: 'grade:read', label: '查看年级' }, { value: 'grade:write', label: '编辑年级' },
    { value: 'class:read', label: '查看班级' }, { value: 'class:write', label: '编辑班级' },
    { value: 'student:read', label: '查看学生' }, { value: 'student:write', label: '编辑学生' },
    { value: 'teacher:read', label: '查看教师' }, { value: 'teacher:write', label: '编辑教师' },
  ]},
  { label: '体测管理', items: [
    { value: 'task:read', label: '查看任务' }, { value: 'task:write', label: '编辑任务' },
    { value: 'score:read', label: '查看成绩' }, { value: 'score:write', label: '编辑成绩' },
    { value: 'score:review', label: '审核成绩' },
  ]},
  { label: '教学管理', items: [
    { value: 'homework:read', label: '查看作业' }, { value: 'homework:write', label: '编辑作业' },
    { value: 'resource:read', label: '查看资源' }, { value: 'resource:write', label: '编辑资源' },
  ]},
  { label: '系统管理', items: [
    { value: 'role:read', label: '查看角色' }, { value: 'role:write', label: '编辑角色' },
    { value: 'account:read', label: '查看账号' }, { value: 'account:write', label: '编辑账号' },
    { value: 'audit:read', label: '查看日志' },
    { value: 'system:settings', label: '系统设置' },
  ]},
];

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/roles', { params: { page: page.value, size: size.value } });
    rows.value = data.rows;
    total.value = data.total;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  form.value = { name: '', code: '', description: '' };
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = { name: row.name, code: row.code, description: row.description || '' };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/roles/${editingId.value}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await request.post('/roles', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此角色？', '提示', { type: 'warning' });
  await request.delete(`/roles/${id}`);
  ElMessage.success('已删除');
  await load();
}

function openPermissions(row: any) {
  permRoleId.value = row.id;
  selectedPerms.value = row.permissions || [];
  permVisible.value = true;
}

async function savePermissions() {
  await request.put(`/roles/${permRoleId.value}`, { permissions: selectedPerms.value });
  ElMessage.success('权限已更新');
  permVisible.value = false;
  await load();
}

onMounted(load);
</script>
