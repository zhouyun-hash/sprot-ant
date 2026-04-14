<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>课表管理</span>
        <div>
          <el-input v-model="filters.classId" placeholder="班级ID" clearable style="width:120px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-input v-model="filters.schoolYear" placeholder="学年" clearable style="width:140px;margin-right:10px" @clear="load" @keyup.enter="load" />
          <el-select v-model="filters.semester" placeholder="学期" clearable style="width:120px;margin-right:10px" @change="load">
            <el-option label="第一学期" :value="1" />
            <el-option label="第二学期" :value="2" />
          </el-select>
          <el-button @click="load">查询</el-button>
          <el-button type="primary" @click="openCreate">新增课程</el-button>
        </div>
      </div>
    </template>

    <el-table :data="periodRows" stripe border class="schedule-grid">
      <el-table-column label="节次" width="80" align="center">
        <template #default="{ row }">第{{ row.period }}节</template>
      </el-table-column>
      <el-table-column v-for="d in 7" :key="d" :label="dayLabels[d - 1]" align="center" min-width="140">
        <template #default="{ row }">
          <div v-if="getCell(row.period, d)" class="cell-content" @click="openEdit(getCell(row.period, d)!)">
            <div class="cell-subject">{{ getCell(row.period, d)!.subject }}</div>
            <div class="cell-time">{{ getCell(row.period, d)!.startTime }}–{{ getCell(row.period, d)!.endTime }}</div>
          </div>
          <div v-else class="cell-empty" @click="openCreateAt(row.period, d)">—</div>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑课程' : '新增课程'" width="600px" destroy-on-close>
    <el-form :model="form" label-width="100px">
      <el-form-item label="班级ID"><el-input v-model="form.classId" /></el-form-item>
      <el-form-item label="教师ID"><el-input v-model="form.teacherId" /></el-form-item>
      <el-form-item label="科目"><el-input v-model="form.subject" /></el-form-item>
      <el-form-item label="星期">
        <el-select v-model="form.dayOfWeek" style="width:100%">
          <el-option v-for="d in 7" :key="d" :label="dayLabels[d - 1]" :value="d" />
        </el-select>
      </el-form-item>
      <el-form-item label="节次">
        <el-select v-model="form.period" style="width:100%">
          <el-option v-for="p in 8" :key="p" :label="`第${p}节`" :value="p" />
        </el-select>
      </el-form-item>
      <el-form-item label="开始时间"><el-time-picker v-model="form.startTime" format="HH:mm" value-format="HH:mm" style="width:100%" /></el-form-item>
      <el-form-item label="结束时间"><el-time-picker v-model="form.endTime" format="HH:mm" value-format="HH:mm" style="width:100%" /></el-form-item>
      <el-form-item label="场地ID"><el-input v-model="form.venueId" /></el-form-item>
      <el-form-item label="学年"><el-input v-model="form.schoolYear" placeholder="如：2025-2026" /></el-form-item>
      <el-form-item label="学期">
        <el-select v-model="form.semester" style="width:100%">
          <el-option label="第一学期" :value="1" />
          <el-option label="第二学期" :value="2" />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

interface Schedule {
  id: number
  classId: string
  teacherId: string
  subject: string
  dayOfWeek: number
  period: number
  startTime: string
  endTime: string
  venueId: string
  schoolYear: string
  semester: number
}

const dayLabels = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
const filters = ref({ classId: '', schoolYear: '', semester: '' as number | '' })
const schedules = ref<Schedule[]>([])
const loading = ref(false)

const periodRows = computed(() => Array.from({ length: 8 }, (_, i) => ({ period: i + 1 })))

function getCell(period: number, day: number): Schedule | undefined {
  return schedules.value.find(s => s.period === period && s.dayOfWeek === day)
}

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (filters.value.classId) params.classId = filters.value.classId
    if (filters.value.schoolYear) params.schoolYear = filters.value.schoolYear
    if (filters.value.semester !== '') params.semester = filters.value.semester
    const { data } = await request.get('/course-schedules', { params })
    schedules.value = Array.isArray(data) ? data : (data.rows || data.items || [])
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const defaultForm = () => ({
  classId: '', teacherId: '', subject: '', dayOfWeek: 1, period: 1,
  startTime: '', endTime: '', venueId: '', schoolYear: '', semester: 1,
})
const form = ref(defaultForm())

function openCreate() {
  editingId.value = null
  form.value = defaultForm()
  dialogVisible.value = true
}

function openCreateAt(period: number, day: number) {
  editingId.value = null
  form.value = { ...defaultForm(), period, dayOfWeek: day }
  if (filters.value.classId) form.value.classId = filters.value.classId
  if (filters.value.schoolYear) form.value.schoolYear = filters.value.schoolYear
  if (filters.value.semester !== '') form.value.semester = filters.value.semester as number
  dialogVisible.value = true
}

function openEdit(row: Schedule) {
  editingId.value = row.id
  form.value = {
    classId: row.classId ?? '',
    teacherId: row.teacherId ?? '',
    subject: row.subject ?? '',
    dayOfWeek: row.dayOfWeek,
    period: row.period,
    startTime: row.startTime ?? '',
    endTime: row.endTime ?? '',
    venueId: row.venueId ?? '',
    schoolYear: row.schoolYear ?? '',
    semester: row.semester ?? 1,
  }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (editingId.value) {
      await request.put(`/course-schedules/${editingId.value}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await request.post('/course-schedules', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.schedule-grid .cell-content {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  transition: background 0.2s;
}
.schedule-grid .cell-content:hover {
  background: var(--el-color-primary-light-7);
}
.schedule-grid .cell-subject {
  font-weight: 600;
  font-size: 14px;
}
.schedule-grid .cell-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.schedule-grid .cell-empty {
  cursor: pointer;
  color: var(--el-text-color-placeholder);
}
</style>
