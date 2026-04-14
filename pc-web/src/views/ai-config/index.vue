<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>AI 算法配置</span>
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <!-- ==================== Tab1: 算法配置 ==================== -->
      <el-tab-pane label="算法配置" name="config">
        <div class="toolbar" style="margin-bottom:12px">
          <div>
            <el-input v-model="cfg.keyword" placeholder="搜索名称" clearable style="width:200px;margin-right:10px" @clear="loadConfigs" @keyup.enter="loadConfigs" />
            <el-select v-model="cfg.categoryFilter" placeholder="分类" clearable style="width:130px;margin-right:10px" @change="loadConfigs">
              <el-option label="动作识别" value="动作识别" />
              <el-option label="人脸识别" value="人脸识别" />
              <el-option label="计分规则" value="计分规则" />
            </el-select>
          </div>
          <el-button type="primary" @click="openCfgCreate">新增配置</el-button>
        </div>

        <el-table :data="cfg.rows" stripe v-loading="cfg.loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="category" label="分类" width="110" />
          <el-table-column prop="version" label="版本" width="90" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">{{ row.status === 'enabled' ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openCfgEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleCfgDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination background layout="total, sizes, prev, pager, next" :total="cfg.total" v-model:current-page="cfg.page" v-model:page-size="cfg.size" :page-sizes="[10,20,50]" @change="loadConfigs" />
        </div>
      </el-tab-pane>

      <!-- ==================== Tab2: 模型管理 ==================== -->
      <el-tab-pane label="模型管理" name="model">
        <div class="toolbar" style="margin-bottom:12px">
          <div>
            <el-input v-model="mdl.keyword" placeholder="搜索模型名称" clearable style="width:200px;margin-right:10px" @clear="loadModels" @keyup.enter="loadModels" />
          </div>
          <el-button type="primary" @click="openMdlCreate">新增模型</el-button>
        </div>

        <el-table :data="mdl.rows" stripe v-loading="mdl.loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="模型名称" min-width="140" />
          <el-table-column prop="type" label="类型" width="110" />
          <el-table-column prop="fileUrl" label="文件地址" min-width="240" show-overflow-tooltip />
          <el-table-column prop="version" label="版本" width="90" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '激活' : '未激活' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="accuracy" label="准确率" width="90">
            <template #default="{ row }">
              {{ row.accuracy != null ? `${row.accuracy}%` : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="handleMdlDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination background layout="total, sizes, prev, pager, next" :total="mdl.total" v-model:current-page="mdl.page" v-model:page-size="mdl.size" :page-sizes="[10,20,50]" @change="loadModels" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>

  <!-- ==================== 算法配置弹窗 ==================== -->
  <el-dialog v-model="cfgDialog" :title="cfgEditingId ? '编辑算法配置' : '新增算法配置'" width="620px" destroy-on-close>
    <el-form :model="cfgForm" label-width="90px">
      <el-form-item label="名称"><el-input v-model="cfgForm.name" /></el-form-item>
      <el-form-item label="分类">
        <el-select v-model="cfgForm.category" style="width:100%">
          <el-option label="动作识别" value="动作识别" />
          <el-option label="人脸识别" value="人脸识别" />
          <el-option label="计分规则" value="计分规则" />
        </el-select>
      </el-form-item>
      <el-form-item label="参数(JSON)">
        <el-input v-model="cfgForm.params" type="textarea" :rows="5" placeholder='{"threshold": 0.8, ...}' />
      </el-form-item>
      <el-form-item label="版本"><el-input v-model="cfgForm.version" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="cfgForm.status" style="width:100%">
          <el-option label="启用" value="enabled" />
          <el-option label="停用" value="disabled" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述"><el-input v-model="cfgForm.description" type="textarea" :rows="2" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="cfgDialog = false">取消</el-button>
      <el-button type="primary" :loading="cfgSaving" @click="handleCfgSave">确定</el-button>
    </template>
  </el-dialog>

  <!-- ==================== 模型新增弹窗 ==================== -->
  <el-dialog v-model="mdlDialog" title="新增模型" width="560px" destroy-on-close>
    <el-form :model="mdlForm" label-width="90px">
      <el-form-item label="模型名称"><el-input v-model="mdlForm.name" /></el-form-item>
      <el-form-item label="类型"><el-input v-model="mdlForm.type" /></el-form-item>
      <el-form-item label="文件地址"><el-input v-model="mdlForm.fileUrl" placeholder="https://..." /></el-form-item>
      <el-form-item label="版本"><el-input v-model="mdlForm.version" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="mdlForm.status" style="width:100%">
          <el-option label="激活" value="active" />
          <el-option label="未激活" value="inactive" />
        </el-select>
      </el-form-item>
      <el-form-item label="准确率"><el-input-number v-model="mdlForm.accuracy" :min="0" :max="100" :precision="1" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="mdlDialog = false">取消</el-button>
      <el-button type="primary" :loading="mdlSaving" @click="handleMdlSave">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const activeTab = ref('config');

// ======================== 算法配置 ========================
const cfg = reactive({
  rows: [] as any[],
  total: 0,
  page: 1,
  size: 20,
  keyword: '',
  categoryFilter: '',
  loading: false,
});

const cfgDialog = ref(false);
const cfgEditingId = ref<number | null>(null);
const cfgSaving = ref(false);
const defaultCfgForm = () => ({ name: '', category: '', params: '', version: '', status: 'enabled', description: '' });
const cfgForm = ref(defaultCfgForm());

async function loadConfigs() {
  cfg.loading = true;
  try {
    const { data } = await request.get('/ai-configs', {
      params: { page: cfg.page, size: cfg.size, keyword: cfg.keyword, category: cfg.categoryFilter },
    });
    cfg.rows = data.rows;
    cfg.total = data.total;
  } finally {
    cfg.loading = false;
  }
}

function openCfgCreate() {
  cfgEditingId.value = null;
  cfgForm.value = defaultCfgForm();
  cfgDialog.value = true;
}

function openCfgEdit(row: any) {
  cfgEditingId.value = row.id;
  cfgForm.value = {
    name: row.name,
    category: row.category,
    params: typeof row.params === 'string' ? row.params : JSON.stringify(row.params, null, 2),
    version: row.version || '',
    status: row.status,
    description: row.description || '',
  };
  cfgDialog.value = true;
}

async function handleCfgSave() {
  cfgSaving.value = true;
  try {
    const payload = { ...cfgForm.value };
    if (cfgEditingId.value) {
      await request.put(`/ai-configs/${cfgEditingId.value}`, payload);
      ElMessage.success('更新成功');
    } else {
      await request.post('/ai-configs', payload);
      ElMessage.success('创建成功');
    }
    cfgDialog.value = false;
    await loadConfigs();
  } finally {
    cfgSaving.value = false;
  }
}

async function handleCfgDelete(id: number) {
  await ElMessageBox.confirm('确定删除此算法配置？', '提示', { type: 'warning' });
  await request.delete(`/ai-configs/${id}`);
  ElMessage.success('已删除');
  await loadConfigs();
}

// ======================== 模型管理 ========================
const mdl = reactive({
  rows: [] as any[],
  total: 0,
  page: 1,
  size: 20,
  keyword: '',
  loading: false,
});

const mdlDialog = ref(false);
const mdlSaving = ref(false);
const defaultMdlForm = () => ({ name: '', type: '', fileUrl: '', version: '', status: 'active', accuracy: 0 });
const mdlForm = ref(defaultMdlForm());

async function loadModels() {
  mdl.loading = true;
  try {
    const { data } = await request.get('/ai-models', {
      params: { page: mdl.page, size: mdl.size, keyword: mdl.keyword },
    });
    mdl.rows = data.rows;
    mdl.total = data.total;
  } finally {
    mdl.loading = false;
  }
}

function openMdlCreate() {
  mdlForm.value = defaultMdlForm();
  mdlDialog.value = true;
}

async function handleMdlSave() {
  mdlSaving.value = true;
  try {
    await request.post('/ai-models', mdlForm.value);
    ElMessage.success('创建成功');
    mdlDialog.value = false;
    await loadModels();
  } finally {
    mdlSaving.value = false;
  }
}

async function handleMdlDelete(id: number) {
  await ElMessageBox.confirm('确定删除此模型？', '提示', { type: 'warning' });
  await request.delete(`/ai-models/${id}`);
  ElMessage.success('已删除');
  await loadModels();
}

// ======================== 初始化 ========================
watch(activeTab, (tab) => {
  if (tab === 'config') loadConfigs();
  else loadModels();
});

onMounted(loadConfigs);
</script>
