<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>帮助中心</span>
        <el-button type="primary" @click="openCreate">新增文章</el-button>
      </div>
    </template>

    <div class="help-layout">
      <div class="help-sidebar">
        <el-menu :default-active="activeCategory" @select="onCategoryChange">
          <el-menu-item index="">全部分类</el-menu-item>
          <el-menu-item v-for="c in categories" :key="c" :index="c">{{ c }}</el-menu-item>
        </el-menu>
      </div>

      <div class="help-main">
        <el-table :data="rows" stripe v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="viewCount" label="浏览量" width="80" />
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
      </div>
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑文章' : '新增文章'" width="640px" destroy-on-close>
    <el-form :model="form" label-width="80px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category" filterable allow-create style="width:100%">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="10" /></el-form-item>
      <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
        </el-select>
      </el-form-item>
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
const loading = ref(false);
const activeCategory = ref('');
const categories = ref<string[]>(['使用指南', '常见问题', '体测帮助', '系统说明']);

const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const defaultForm = () => ({ title: '', category: '', content: '', sortOrder: 0, status: 'published' });
const form = ref(defaultForm());

async function load() {
  loading.value = true;
  try {
    const params: any = { page: page.value, size: size.value };
    if (activeCategory.value) params.category = activeCategory.value;
    const { data } = await request.get('/help-articles', { params });
    rows.value = data.rows ?? data.items ?? [];
    total.value = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onCategoryChange(cat: string) {
  activeCategory.value = cat;
  page.value = 1;
  load();
}

function openCreate() {
  editingId.value = null;
  form.value = defaultForm();
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  form.value = { title: row.title, category: row.category || '', content: row.content || '', sortOrder: row.sortOrder ?? 0, status: row.status || 'published' };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingId.value) {
      await request.put(`/help-articles/${editingId.value}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await request.post('/help-articles', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此文章？', '提示', { type: 'warning' });
  await request.delete(`/help-articles/${id}`);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>

<style scoped>
.help-layout {
  display: flex;
  gap: 16px;
}
.help-sidebar {
  width: 160px;
  flex-shrink: 0;
}
.help-main {
  flex: 1;
  min-width: 0;
}
</style>
