<template>
  <div class="dashboard">
    <div class="dash-header">
      <h3 class="dash-title">数据驾驶舱</h3>
      <el-button @click="load" :loading="loading">刷新数据</el-button>
    </div>

    <el-row :gutter="16" class="kpi-row">
      <el-col :span="8">
        <div class="kpi-card kpi-pass">
          <div class="kpi-label">达标率</div>
          <div class="kpi-value">{{ formatPercent(data.passRate) }}</div>
          <div class="kpi-bar">
            <div class="kpi-bar-fill" :style="{ width: formatPercent(data.passRate) }"></div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="kpi-card kpi-excellent">
          <div class="kpi-label">优秀率</div>
          <div class="kpi-value">{{ formatPercent(data.excellentRate) }}</div>
          <div class="kpi-bar">
            <div class="kpi-bar-fill" :style="{ width: formatPercent(data.excellentRate) }"></div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="kpi-card kpi-exercise">
          <div class="kpi-label">人均运动时长</div>
          <div class="kpi-value">{{ data.avgExerciseMinutes || 0 }}<span class="kpi-unit">分钟</span></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="page-card dash-card">
          <template #header>
            <span class="card-title">体质健康概况</span>
          </template>
          <div class="placeholder-chart">
            <el-icon :size="48" color="#bdd9f9"><Histogram /></el-icon>
            <p>图表区域（接入 ECharts 后展示）</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="page-card dash-card">
          <template #header>
            <span class="card-title">年级对比分析</span>
          </template>
          <div class="placeholder-chart">
            <el-icon :size="48" color="#bdd9f9"><PieChart /></el-icon>
            <p>图表区域（接入 ECharts 后展示）</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { Histogram, PieChart } from '@element-plus/icons-vue';
import request from '@/utils/request';

const data = reactive<Record<string, any>>({});
const loading = ref(false);

function formatPercent(v: any) {
  const n = Number(v || 0);
  return `${(n * 100).toFixed(1)}%`;
}

async function load() {
  loading.value = true;
  try {
    const res = await request.get('/dashboard/overview');
    Object.assign(data, res.data || {});
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dash-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a3353;
}

/* ── KPI 卡片 ── */
.kpi-row {
  margin: 0;
}

.kpi-card {
  border-radius: var(--card-radius);
  padding: 28px 24px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.kpi-pass {
  background: linear-gradient(135deg, #1a73e8, #4fc3f7);
}

.kpi-excellent {
  background: linear-gradient(135deg, #00b894, #55efc4);
}

.kpi-exercise {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
}

.kpi-label {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.kpi-unit {
  font-size: 14px;
  font-weight: 400;
  margin-left: 4px;
  opacity: 0.8;
}

.kpi-bar {
  margin-top: 12px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.kpi-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.7);
  transition: width 0.6s ease;
}

/* ── 图表占位 ── */
.dash-card {
  min-height: 280px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a3353;
}

.placeholder-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #8c99a8;
  gap: 12px;
}

.placeholder-chart p {
  margin: 0;
  font-size: 13px;
}
</style>
