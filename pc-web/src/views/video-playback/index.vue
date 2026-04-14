<template>
  <div>
    <el-card class="page-card" style="margin-bottom: 20px">
      <el-space>
        <el-input v-model="keyword" placeholder="搜索学生姓名/学号" clearable style="width: 260px" @keyup.enter="load" />
        <el-button type="primary" @click="load">搜索</el-button>
      </el-space>
    </el-card>

    <div v-loading="loading">
      <el-empty v-if="!rows.length" description="暂无视频数据" />
      <el-row :gutter="16" v-else>
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in rows" :key="item.id" style="margin-bottom: 16px">
          <el-card class="video-card" shadow="hover">
            <div class="video-cover" @click="playVideo(item)">
              <template v-if="item.videoUrl">
                <video :src="item.videoUrl" preload="metadata" class="video-el" />
                <div class="play-overlay">
                  <el-icon :size="40"><CaretRight /></el-icon>
                </div>
              </template>
              <template v-else>
                <div class="no-video">
                  <el-icon :size="36"><VideoCamera /></el-icon>
                  <span>暂无视频</span>
                </div>
              </template>
            </div>
            <div class="video-info">
              <div class="video-title">{{ item.student?.user?.name || '未知学生' }}</div>
              <div class="video-meta">{{ item.project || '-' }}</div>
              <div class="video-meta">{{ item.createdAt || '-' }}</div>
            </div>
            <div class="video-actions">
              <el-button size="small" type="primary" @click="playVideo(item)">
                <el-icon><CaretRight /></el-icon> 播放
              </el-button>
              <el-button size="small" @click="showDetail(item)">
                <el-icon><View /></el-icon> 详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="pager" v-if="rows.length">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          background
          layout="total, prev, pager, next"
          :total="total"
          @current-change="load"
        />
      </div>
    </div>

    <el-dialog v-model="playerVisible" title="视频播放" width="720px" destroy-on-close>
      <div v-if="currentItem?.videoUrl" style="text-align: center">
        <video :src="currentItem.videoUrl" controls autoplay style="width: 100%; max-height: 420px; border-radius: 8px" />
      </div>
      <el-empty v-else description="该记录暂无视频" />
    </el-dialog>

    <el-dialog v-model="detailVisible" title="成绩详情" width="480px">
      <el-descriptions :column="1" border v-if="currentItem">
        <el-descriptions-item label="学生姓名">{{ currentItem.student?.user?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="项目">{{ currentItem.project || '-' }}</el-descriptions-item>
        <el-descriptions-item label="成绩">{{ currentItem.result }} {{ currentItem.unit }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ currentItem.reviewStatus || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentItem.createdAt || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { CaretRight, VideoCamera, View } from '@element-plus/icons-vue';
import request from '@/utils/request';

const rows = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const keyword = ref('');
const query = reactive({ page: 1, pageSize: 12 });

const playerVisible = ref(false);
const detailVisible = ref(false);
const currentItem = ref<any>(null);

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: query.page, pageSize: query.pageSize };
    if (keyword.value.trim()) params.keyword = keyword.value.trim();
    const res = await request.get('/scores', { params });
    rows.value = res.data?.items || [];
    total.value = Number(res.data?.total || 0);
  } finally {
    loading.value = false;
  }
}

function playVideo(item: any) {
  if (!item.videoUrl) {
    ElMessage.info('该记录暂无视频');
    return;
  }
  currentItem.value = item;
  playerVisible.value = true;
}

function showDetail(item: any) {
  currentItem.value = item;
  detailVisible.value = true;
}

onMounted(load);
</script>

<style scoped>
.video-card {
  border-radius: 12px;
  overflow: hidden;
}
.video-card :deep(.el-card__body) {
  padding: 0;
}
.video-cover {
  position: relative;
  height: 180px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}
.video-el {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}
.video-cover:hover .play-overlay {
  opacity: 1;
}
.no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #bbb;
  font-size: 13px;
}
.video-info {
  padding: 12px 14px 4px;
}
.video-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}
.video-meta {
  font-size: 12px;
  color: #888;
  line-height: 1.6;
}
.video-actions {
  padding: 8px 14px 14px;
  display: flex;
  gap: 8px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
