<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>作业批改</span>
      </div>
    </template>

    <el-tabs v-model="statusTab" @tab-change="handleTabChange">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="待批改" name="pending" />
      <el-tab-pane label="已完成" name="completed" />
    </el-tabs>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="submissionId" label="提交ID" width="100" />
      <el-table-column prop="aiScore" label="AI评分" width="100" />
      <el-table-column prop="manualScore" label="人工评分" width="100" />
      <el-table-column label="评语" min-width="180">
        <template #default="{ row }">
          <el-tooltip v-if="row.comment" :content="row.comment" placement="top" :show-after="300">
            <span class="comment-cell">{{ row.comment }}</span>
          </el-tooltip>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="批改方式" width="110">
        <template #default="{ row }">
          <el-tag :type="correctionTagType(row.correctionType)" size="small">{{ correctionLabel(row.correctionType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">{{ row.status === 'completed' ? '已完成' : '待批改' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openScore(row)">评分</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, sizes, prev, pager, next" :total="total" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" @change="load" />
    </div>
  </el-card>

  <el-dialog v-model="scoreDialogVisible" title="人工评分" width="500px" destroy-on-close>
    <el-form :model="scoreForm" label-width="100px">
      <el-form-item label="提交ID">
        <el-input :model-value="scoreForm.submissionId" disabled />
      </el-form-item>
      <el-form-item label="AI评分">
        <el-input :model-value="scoreForm.aiScore" disabled />
      </el-form-item>
      <el-form-item label="人工评分">
        <el-input-number v-model="scoreForm.manualScore" :min="0" :max="100" style="width:100%" />
      </el-form-item>
      <el-form-item label="评语">
        <el-input v-model="scoreForm.comment" type="textarea" :rows="4" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="scoreDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleScore">提交评分</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const rows = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const statusTab = ref('')
const loading = ref(false)

const scoreDialogVisible = ref(false)
const saving = ref(false)
const scoreForm = ref({
  id: null as number | null,
  submissionId: '',
  aiScore: '' as string | number,
  manualScore: 0,
  comment: '',
})

const correctionMap: Record<string, string> = { ai: 'AI批改', manual: '人工批改', mixed: '混合批改' }
function correctionLabel(t: string) { return correctionMap[t] || t }
function correctionTagType(t: string) {
  const m: Record<string, string> = { ai: '', manual: 'warning', mixed: 'success' }
  return m[t] || 'info'
}

function handleTabChange() {
  page.value = 1
  load()
}

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/homework-corrections', {
      params: { page: page.value, size: size.value, status: statusTab.value },
    })
    rows.value = data.rows || data.items || []
    total.value = data.total ?? 0
  } finally {
    loading.value = false
  }
}

function openScore(row: any) {
  scoreForm.value = {
    id: row.id,
    submissionId: row.submissionId ?? '',
    aiScore: row.aiScore ?? '-',
    manualScore: row.manualScore ?? 0,
    comment: row.comment ?? '',
  }
  scoreDialogVisible.value = true
}

async function handleScore() {
  saving.value = true
  try {
    const payload = {
      submissionId: scoreForm.value.submissionId,
      manualScore: scoreForm.value.manualScore,
      comment: scoreForm.value.comment,
      correctionType: 'manual',
      status: 'completed',
    }
    if (scoreForm.value.id) {
      await request.put(`/homework-corrections/${scoreForm.value.id}`, payload)
    } else {
      await request.post('/homework-corrections', payload)
    }
    ElMessage.success('评分提交成功')
    scoreDialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
