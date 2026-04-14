<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>教学资源库</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索资源" clearable style="width:180px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="typeFilter" placeholder="类型" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="视频" value="video" />
            <el-option label="文档" value="document" />
            <el-option label="图片" value="image" />
            <el-option label="其他" value="other" />
          </el-select>
          <el-input v-model="categoryFilter" placeholder="分类" clearable style="width:120px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-button-group style="margin-right:10px">
            <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">列表</el-button>
            <el-button :type="viewMode === 'card' ? 'primary' : ''" @click="viewMode = 'card'">卡片</el-button>
          </el-button-group>
          <el-button type="primary" @click="openCreate">上传资源</el-button>
        </div>
      </div>
    </template>

    <!-- 列表视图 -->
    <template v-if="viewMode === 'list'">
      <el-table :data="rows" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="大小" width="100">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="downloadCount" label="下载次数" width="100" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 卡片视图 -->
    <template v-else>
      <el-row :gutter="16" v-loading="loading">
        <el-col v-for="item in rows" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6" style="margin-bottom:16px">
          <el-card shadow="hover" class="resource-card" @click="openEdit(item)">
            <div class="resource-card-icon">
              <el-icon :size="40"><component :is="typeIcon(item.type)" /></el-icon>
            </div>
            <div class="resource-card-title">{{ item.title }}</div>
            <div class="resource-card-meta">
              <el-tag size="small">{{ typeLabel(item.type) }}</el-tag>
              <span>{{ formatSize(item.fileSize) }}</span>
            </div>
            <div class="resource-card-meta">
              <span>下载: {{ item.downloadCount ?? 0 }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col v-if="!rows.length && !loading" :span="24">
          <el-empty description="暂无资源" />
        </el-col>
      </el-row>
    </template>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[12,24,48]" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑资源' : '上传资源'" width="600px" destroy-on-close>
    <el-form :model="form" label-width="100px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" style="width:100%">
          <el-option label="视频" value="video" />
          <el-option label="文档" value="document" />
          <el-option label="图片" value="image" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="分类"><el-input v-model="form.category" /></el-form-item>
      <el-form-item label="文件URL"><el-input v-model="form.fileUrl" /></el-form-item>
      <el-form-item label="文件大小"><el-input-number v-model="form.fileSize" :min="0" style="width:100%" /></el-form-item>
      <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, Document, Picture, Files } from '@element-plus/icons-vue'
import request from '@/utils/request'

const rows = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(12)
const keyword = ref('')
const typeFilter = ref('')
const categoryFilter = ref('')
const viewMode = ref<'list' | 'card'>('card')
const loading = ref(false)

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const defaultForm = () => ({
  title: '', type: 'video', category: '', fileUrl: '', fileSize: 0, description: '',
})
const form = ref(defaultForm())

const typeMap: Record<string, string> = { video: '视频', document: '文档', image: '图片', other: '其他' }
function typeLabel(t: string) { return typeMap[t] || t }

function typeIcon(t: string) {
  const m: Record<string, any> = { video: VideoPlay, document: Document, image: Picture, other: Files }
  return m[t] || Files
}

function formatSize(bytes?: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/teaching-resources', {
      params: { page: page.value, size: size.value, keyword: keyword.value, type: typeFilter.value, category: categoryFilter.value },
    })
    rows.value = data.rows || data.items || []
    total.value = data.total ?? 0
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = defaultForm()
  dialogVisible.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  form.value = {
    title: row.title ?? '',
    type: row.type ?? 'video',
    category: row.category ?? '',
    fileUrl: row.fileUrl ?? '',
    fileSize: row.fileSize ?? 0,
    description: row.description ?? '',
  }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (editingId.value) {
      await request.put(`/teaching-resources/${editingId.value}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await request.post('/teaching-resources', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此资源？', '提示', { type: 'warning' })
  await request.delete(`/teaching-resources/${id}`)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>

<style scoped>
.resource-card {
  cursor: pointer;
  text-align: center;
}
.resource-card-icon {
  padding: 16px 0 8px;
  color: var(--el-color-primary);
}
.resource-card-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.resource-card-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
</style>
