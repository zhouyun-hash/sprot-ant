<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <el-space>
          <el-button @click="goBack">返回作业列表</el-button>
          <span>作业提交详情（作业ID: {{ homeworkId }}）</span>
        </el-space>
      </div>
    </template>

    <el-table :data="rows" stripe>
      <el-table-column label="学生姓名" min-width="140">
        <template #default="{ row }">
          {{ row.student?.user?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="提交视频" min-width="220">
        <template #default="{ row }">
          <el-link v-if="getVideoUrl(row)" type="primary" @click="openVideo(getVideoUrl(row)!)">播放视频</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="aiScore" label="AI评分" width="100" />
      <el-table-column prop="teacherScore" label="教师评分" width="100" />
      <el-table-column prop="comment" label="评语" min-width="220" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-space>
            <el-button link type="primary" @click="openGrade(row)">批改</el-button>
            <el-button link type="success" @click="runAiGrade(row)">AI自动评分</el-button>
          </el-space>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="gradeVisible" title="教师批改" width="420px">
    <el-form label-width="90px">
      <el-form-item label="教师评分">
        <el-input-number v-model="gradeForm.teacherScore" :min="0" :max="100" />
      </el-form-item>
      <el-form-item label="评语">
        <el-input v-model="gradeForm.comment" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="gradeVisible = false">取消</el-button>
      <el-button type="primary" @click="saveGrade">提交</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="videoVisible" title="提交视频" width="860px">
    <video v-if="currentVideoUrl" :src="currentVideoUrl" controls style="width: 100%; max-height: 70vh" />
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();
const homeworkId = Number(route.params.homeworkId || 0);
const rows = ref<any[]>([]);

const gradeVisible = ref(false);
const gradeForm = reactive<any>({ submissionId: null, teacherScore: 80, comment: '' });

const videoVisible = ref(false);
const currentVideoUrl = ref('');

function getVideoUrl(row: any) {
  return row.videoUrl || row.video_url || row.submissionVideo || row.video || '';
}

function openVideo(url: string) {
  currentVideoUrl.value = url;
  videoVisible.value = true;
}

async function load() {
  if (!homeworkId) return;
  const res = await request.get(`/homework/${homeworkId}/submissions`);
  rows.value = res.data?.items || [];
}

function openGrade(row: any) {
  Object.assign(gradeForm, {
    submissionId: row.id,
    teacherScore: row.teacherScore ?? 80,
    comment: row.comment || '',
  });
  gradeVisible.value = true;
}

async function saveGrade() {
  await request.post(`/homework/submission/${gradeForm.submissionId}/grade`, {
    teacherScore: Number(gradeForm.teacherScore),
    comment: gradeForm.comment || undefined,
  });
  ElMessage.success('批改成功');
  gradeVisible.value = false;
  await load();
}

async function runAiGrade(row: any) {
  await request.post(`/homework/submission/${row.id}/ai-grade`, {});
  ElMessage.success('AI自动评分完成');
  await load();
}

function goBack() {
  router.push('/homework');
}

onMounted(load);
</script>
