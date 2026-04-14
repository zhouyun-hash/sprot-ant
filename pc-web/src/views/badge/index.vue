<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>勋章管理</span>
        <div>
          <el-button type="primary" @click="openCreate">新增勋章</el-button>
          <el-button @click="openAward">颁发勋章</el-button>
        </div>
      </div>
    </template>

    <el-row :gutter="16" v-loading="loading">
      <el-col v-for="item in rows" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6" style="margin-bottom:16px">
        <el-card shadow="hover" class="badge-card">
          <div class="badge-icon">
            <el-icon :size="48" color="#f0a020"><Trophy /></el-icon>
          </div>
          <h4>{{ item.name }}</h4>
          <p class="badge-desc">{{ item.description || '-' }}</p>
          <p class="badge-cond">条件：{{ item.condition || '-' }}</p>
          <div class="badge-footer">
            <el-tag :type="item.status === 'active' ? 'success' : 'info'" size="small">
              {{ item.status === 'active' ? '启用' : '停用' }}
            </el-tag>
            <span>
              <el-button size="small" link @click="openEdit(item)">编辑</el-button>
              <el-button size="small" link type="danger" @click="handleDelete(item.id)">删除</el-button>
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col v-if="!loading && rows.length === 0" :span="24">
        <el-empty description="暂无勋章" />
      </el-col>
    </el-row>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑勋章' : '新增勋章'" width="480px" destroy-on-close>
    <el-form :model="form" label-width="80px">
      <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
      <el-form-item label="获取条件"><el-input v-model="form.condition" /></el-form-item>
      <el-form-item label="图标URL"><el-input v-model="form.iconUrl" placeholder="可选" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="启用" value="active" />
          <el-option label="停用" value="inactive" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="awardVisible" title="颁发勋章" width="480px" destroy-on-close>
    <el-form :model="awardForm" label-width="80px">
      <el-form-item label="勋章">
        <el-select v-model="awardForm.badgeId" style="width:100%">
          <el-option v-for="b in rows" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="学生ID">
        <el-input v-model="awardForm.studentIds" placeholder="多个ID用逗号分隔" />
      </el-form-item>
      <el-form-item label="颁发理由"><el-input v-model="awardForm.reason" type="textarea" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="awardVisible = false">取消</el-button>
      <el-button type="primary" :loading="awarding" @click="handleAward">颁发</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Trophy } from '@element-plus/icons-vue';
import request from '@/utils/request';

const rows = ref<any[]>([]);
const loading = ref(false);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const defaultForm = () => ({ name: '', description: '', condition: '', iconUrl: '', status: 'active' });
const form = ref(defaultForm());

const awardVisible = ref(false);
const awarding = ref(false);
const awardForm = ref({ badgeId: null as number | null, studentIds: '', reason: '' });

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/badges', { params: { page: 1, size: 100 } });
    rows.value = data.rows ?? data.items ?? [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.value = defaultForm();
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = { name: row.name, description: row.description || '', condition: row.condition || '', iconUrl: row.iconUrl || '', status: row.status || 'active' };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/badges/${editingId.value}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await request.post('/badges', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此勋章？', '提示', { type: 'warning' });
  await request.delete(`/badges/${id}`);
  ElMessage.success('已删除');
  await load();
}

function openAward() {
  awardForm.value = { badgeId: null, studentIds: '', reason: '' };
  awardVisible.value = true;
}

async function handleAward() {
  if (!awardForm.value.badgeId) {
    ElMessage.warning('请选择勋章');
    return;
  }
  awarding.value = true;
  try {
    const ids = awardForm.value.studentIds.split(',').map(s => s.trim()).filter(Boolean);
    await request.post('/badges/award', {
      badgeId: awardForm.value.badgeId,
      studentIds: ids,
      reason: awardForm.value.reason,
    });
    ElMessage.success('颁发成功');
    awardVisible.value = false;
  } finally {
    awarding.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.badge-card {
  text-align: center;
}
.badge-icon {
  margin: 8px 0 12px;
}
.badge-card h4 {
  margin: 0 0 8px;
  font-size: 16px;
}
.badge-desc,
.badge-cond {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badge-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}
</style>
