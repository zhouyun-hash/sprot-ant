<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>学校信息管理</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索学校名称" clearable style="width:200px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-button type="primary" @click="openCreate">新增学校</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="学校名称" min-width="160" />
      <el-table-column prop="code" label="学校编码" width="120" />
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column prop="phone" label="联系电话" width="140" />
      <el-table-column prop="principal" label="校长" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" @click="openCampus(row)">校区</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑学校' : '新增学校'" width="560px" destroy-on-close>
    <el-form :model="form" label-width="80px">
      <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="编码"><el-input v-model="form.code" /></el-form-item>
      <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
      <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="校长"><el-input v-model="form.principal" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="campusVisible" title="校区管理" width="640px" destroy-on-close>
    <div style="margin-bottom:12px;display:flex;justify-content:flex-end">
      <el-button type="primary" size="small" @click="addCampus">新增校区</el-button>
    </div>
    <el-table :data="campuses" stripe>
      <el-table-column prop="name" label="校区名称" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="deleteCampus(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const keyword = ref('');
const loading = ref(false);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const form = ref({ name: '', code: '', address: '', phone: '', principal: '' });

const campusVisible = ref(false);
const campuses = ref<any[]>([]);
const currentSchoolId = ref<number>(0);

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/schools', { params: { page: page.value, size: size.value, keyword: keyword.value } });
    rows.value = data.rows;
    total.value = data.total;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  form.value = { name: '', code: '', address: '', phone: '', principal: '' };
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = { name: row.name, code: row.code || '', address: row.address || '', phone: row.phone || '', principal: row.principal || '' };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/schools/${editingId.value}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await request.post('/schools', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此学校？', '提示', { type: 'warning' });
  await request.delete(`/schools/${id}`);
  ElMessage.success('已删除');
  await load();
}

async function openCampus(row: any) {
  currentSchoolId.value = row.id;
  const { data } = await request.get(`/schools/${row.id}/campuses`);
  campuses.value = data;
  campusVisible.value = true;
}

async function addCampus() {
  const { value } = await ElMessageBox.prompt('请输入校区名称', '新增校区');
  if (value) {
    await request.post(`/schools/${currentSchoolId.value}/campuses`, { name: value });
    ElMessage.success('创建成功');
    const { data } = await request.get(`/schools/${currentSchoolId.value}/campuses`);
    campuses.value = data;
  }
}

async function deleteCampus(id: number) {
  await ElMessageBox.confirm('确定删除此校区？', '提示', { type: 'warning' });
  await request.delete(`/schools/campuses/${id}`);
  ElMessage.success('已删除');
  const { data } = await request.get(`/schools/${currentSchoolId.value}/campuses`);
  campuses.value = data;
}

onMounted(load);
</script>
