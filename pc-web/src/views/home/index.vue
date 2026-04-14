<template>
  <div class="home">
    <div class="welcome-banner">
      <div class="welcome-text">
        <h2>欢迎回来，{{ userStore.user?.name || userStore.user?.username || '管理员' }}</h2>
        <p>AI 智慧体育一体化管理平台 — 教、学、评、练、管全流程闭环</p>
      </div>
      <div class="welcome-deco"></div>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="6" v-for="item in statCards" :key="item.key">
        <div class="stat-card" :style="{ background: item.bg }">
          <div class="stat-icon">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="quick-row">
      <el-col :span="8" v-for="action in quickActions" :key="action.label">
        <el-card class="quick-card page-card" @click="$router.push(action.path)" shadow="hover">
          <div class="quick-inner">
            <el-icon :size="36" :style="{ color: action.color }"><component :is="action.icon" /></el-icon>
            <div>
              <div class="quick-title">{{ action.label }}</div>
              <div class="quick-desc">{{ action.desc }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed } from 'vue';
import {
  Collection,
  User,
  UserFilled,
  List,
  DataAnalysis,
  Notebook,
  Histogram,
} from '@element-plus/icons-vue';
import request from '@/utils/request';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const stats = reactive({ classCount: 0, studentCount: 0, teacherCount: 0, taskCount: 0 });

const statCards = computed(() => [
  {
    key: 'class',
    label: '班级总数',
    value: stats.classCount,
    icon: Collection,
    bg: 'linear-gradient(135deg, #1a73e8, #4fc3f7)',
  },
  {
    key: 'student',
    label: '学生总数',
    value: stats.studentCount,
    icon: User,
    bg: 'linear-gradient(135deg, #00b894, #55efc4)',
  },
  {
    key: 'teacher',
    label: '教师总数',
    value: stats.teacherCount,
    icon: UserFilled,
    bg: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  },
  {
    key: 'task',
    label: '任务总数',
    value: stats.taskCount,
    icon: List,
    bg: 'linear-gradient(135deg, #e17055, #fab1a0)',
  },
]);

const quickActions = [
  { label: '体测任务', desc: '创建和管理体测任务', icon: List, color: '#1a73e8', path: '/tasks' },
  { label: '成绩管理', desc: '查看与复核学生成绩', icon: DataAnalysis, color: '#00b894', path: '/scores' },
  { label: '数据驾驶舱', desc: '全校数据概览分析', icon: Histogram, color: '#6c5ce7', path: '/dashboard' },
];

onMounted(async () => {
  const [c, s, t, k] = await Promise.allSettled([
    request.get('/classes', { params: { page: 1, pageSize: 1 } }),
    request.get('/students', { params: { page: 1, pageSize: 1 } }),
    request.get('/teachers', { params: { page: 1, pageSize: 1 } }),
    request.get('/tasks', { params: { page: 1, pageSize: 1 } }),
  ]);
  stats.classCount = c.status === 'fulfilled' ? Number(c.value.data?.total || 0) : 0;
  stats.studentCount = s.status === 'fulfilled' ? Number(s.value.data?.total || 0) : 0;
  stats.teacherCount = t.status === 'fulfilled' ? Number(t.value.data?.total || 0) : 0;
  stats.taskCount = k.status === 'fulfilled' ? Number(k.value.data?.total || 0) : 0;
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── 欢迎横幅 ── */
.welcome-banner {
  background: linear-gradient(135deg, #1a73e8, #4fc3f7);
  border-radius: var(--card-radius);
  padding: 32px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.welcome-banner::after {
  content: '';
  position: absolute;
  right: -40px;
  top: -40px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

.welcome-text h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.welcome-text p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

/* ── 统计卡片 ── */
.stat-row {
  margin: 0;
}

.stat-card {
  border-radius: var(--card-radius);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #fff;
  min-height: 90px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 2px;
}

/* ── 快捷入口 ── */
.quick-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.quick-card:hover {
  transform: translateY(-2px);
}

.quick-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.quick-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a3353;
}

.quick-desc {
  font-size: 12px;
  color: #8c99a8;
  margin-top: 4px;
}
</style>
