<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>体测标准配置</span>
        <div>
          <el-input-number v-model="projectIdFilter" :min="1" placeholder="项目ID" controls-position="right" style="width:130px;margin-right:10px" @change="load" />
          <el-select v-model="genderFilter" placeholder="性别" clearable style="width:100px;margin-right:10px" @change="load">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
          <el-input v-model="versionFilter" placeholder="版本" clearable style="width:120px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-button type="primary" @click="openCreate">新增标准</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="projectId" label="项目ID" width="90" />
      <el-table-column label="性别" width="80">
        <template #default="{ row }">{{ row.gender === 'male' ? '男' : '女' }}</template>
      </el-table-column>
      <el-table-column label="年龄范围" width="120">
        <template #default="{ row }">{{ row.ageMin }}–{{ row.ageMax }}</template>
      </el-table-column>
      <el-table-column prop="gradeLevel" label="学段" width="100" />
      <el-table-column prop="version" label="版本" width="100" />
      <el-table-column label="启用" width="80">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑体测标准' : '新增体测标准'" width="600px" destroy-on-close>
    <el-form :model="form" label-width="100px">
      <el-form-item label="项目ID"><el-input-number v-model="form.projectId" :min="1" style="width:100%" /></el-form-item>
      <el-form-item label="性别">
        <el-select v-model="form.gender" style="width:100%">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
        </el-select>
      </el-form-item>
      <el-form-item label="最小年龄"><el-input-number v-model="form.ageMin" :min="1" :max="25" style="width:100%" /></el-form-item>
      <el-form-item label="最大年龄"><el-input-number v-model="form.ageMax" :min="1" :max="25" style="width:100%" /></el-form-item>
      <el-form-item label="学段">
        <el-select v-model="form.gradeLevel" style="width:100%">
          <el-option label="小学" value="小学" />
          <el-option label="初中" value="初中" />
          <el-option label="高中" value="高中" />
        </el-select>
      </el-form-item>
      <el-form-item label="评分规则">
        <el-input v-model="form.scoreRules" type="textarea" :rows="6" placeholder="请输入 JSON 格式的评分规则" />
      </el-form-item>
      <el-form-item label="版本"><el-input v-model="form.version" /></el-form-item>
      <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
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

const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const projectIdFilter = ref<number | undefined>(undefined);
const genderFilter = ref('');
const versionFilter = ref('');
const loading = ref(false);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const form = ref({ projectId: 1, gender: 'male', ageMin: 6, ageMax: 12, gradeLevel: '', scoreRules: '', version: '', enabled: true });

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/exam-standards', { params: { page: page.value, size: size.value, projectId: projectIdFilter.value, gender: genderFilter.value, version: versionFilter.value } });
    rows.value = data.rows;
    total.value = data.total;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  form.value = { projectId: 1, gender: 'male', ageMin: 6, ageMax: 12, gradeLevel: '', scoreRules: '', version: '', enabled: true };
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = {
    projectId: row.projectId,
    gender: row.gender,
    ageMin: row.ageMin,
    ageMax: row.ageMax,
    gradeLevel: row.gradeLevel || '',
    scoreRules: typeof row.scoreRules === 'string' ? row.scoreRules : JSON.stringify(row.scoreRules, null, 2),
    version: row.version || '',
    enabled: !!row.enabled,
  };
  dialogVisible.value = true;
}

async function handleSave() {
  if (form.value.scoreRules) {
    try { JSON.parse(form.value.scoreRules); } catch {
      ElMessage.warning('评分规则必须为合法 JSON');
      return;
    }
  }
  saving.value = true;
  try {
    const payload = { ...form.value, scoreRules: form.value.scoreRules ? JSON.parse(form.value.scoreRules) : null };
    if (editingId.value) {
      await request.put(`/exam-standards/${editingId.value}`, payload);
      ElMessage.success('更新成功');
    } else {
      await request.post('/exam-standards', payload);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally { saving.value = false; }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此体测标准？', '提示', { type: 'warning' });
  await request.delete(`/exam-standards/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>
