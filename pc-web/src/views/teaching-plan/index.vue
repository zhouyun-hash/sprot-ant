<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>教学计划</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索标题" clearable style="width:200px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="statusFilter" placeholder="状态" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增计划</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="160" />
      <el-table-column prop="teacherId" label="教师ID" width="100" />
      <el-table-column prop="gradeId" label="年级ID" width="100" />
      <el-table-column prop="schoolYear" label="学年" width="120" />
      <el-table-column prop="semester" label="学期" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">{{ statusLabel(row.status) }}</el-tag>
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

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑教学计划' : '新增教学计划'" width="650px" destroy-on-close>
    <el-form :model="form" label-width="100px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="教师ID"><el-input v-model="form.teacherId" /></el-form-item>
      <el-form-item label="年级ID"><el-input v-model="form.gradeId" /></el-form-item>
      <el-form-item label="学年"><el-input v-model="form.schoolYear" placeholder="如：2025-2026" /></el-form-item>
      <el-form-item label="学期">
        <el-select v-model="form.semester" style="width:100%">
          <el-option label="第一学期" :value="1" />
          <el-option label="第二学期" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="5" /></el-form-item>
      <el-form-item label="资源ID"><el-input v-model="form.resourceIds" placeholder="多个用逗号分隔，如：1,2,3" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const rows = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const statusFilter = ref('')
const loading = ref(false)

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const defaultForm = () => ({
  title: '', teacherId: '', gradeId: '', schoolYear: '', semester: 1,
  content: '', resourceIds: '', status: 'draft',
})
const form = ref(defaultForm())

function statusLabel(s: string) {
  return s === 'published' ? '已发布' : '草稿'
}

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/teaching-plans', {
      params: { page: page.value, size: size.value, keyword: keyword.value, status: statusFilter.value },
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
    teacherId: row.teacherId ?? '',
    gradeId: row.gradeId ?? '',
    schoolYear: row.schoolYear ?? '',
    semester: row.semester ?? 1,
    content: row.content ?? '',
    resourceIds: Array.isArray(row.resourceIds) ? row.resourceIds.join(',') : (row.resourceIds ?? ''),
    status: row.status ?? 'draft',
  }
  dialogVisible.value = true
}

function parseIds(str: string): number[] {
  return str.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n))
}

async function handleSave() {
  saving.value = true
  try {
    const payload = { ...form.value, resourceIds: parseIds(form.value.resourceIds) }
    if (editingId.value) {
      await request.put(`/teaching-plans/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await request.post('/teaching-plans', payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除此教学计划？', '提示', { type: 'warning' })
  await request.delete(`/teaching-plans/${id}`)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>
