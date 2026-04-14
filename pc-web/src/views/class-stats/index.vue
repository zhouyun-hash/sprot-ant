<template>
  <div class="class-stats">
    <div class="page-header">
      <h3 class="page-title">班级运动数据</h3>
      <el-select v-model="selectedClass" placeholder="选择班级" style="width: 200px" @change="onClassChange">
        <el-option v-for="c in classList" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
    </div>

    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="card in statCards" :key="card.label">
        <div class="stat-card" :style="{ background: card.bg }">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.value }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header><span class="card-title">体测项目维度雷达图</span></template>
          <div ref="radarRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header><span class="card-title">成绩趋势</span></template>
          <div ref="trendRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';

const selectedClass = ref(1);

const classList = [
  { id: 1, name: '一年级1班' },
  { id: 2, name: '一年级2班' },
  { id: 3, name: '二年级1班' },
  { id: 4, name: '二年级2班' },
  { id: 5, name: '三年级1班' },
];

const mockData: Record<number, { total: number; avg: number; passRate: number; excellentRate: number; radar: number[]; trend: number[] }> = {
  1: { total: 45, avg: 82.5, passRate: 93.3, excellentRate: 31.1, radar: [85, 78, 90, 72, 88], trend: [78, 80, 79, 82, 85, 82.5] },
  2: { total: 42, avg: 79.2, passRate: 88.1, excellentRate: 26.2, radar: [80, 72, 85, 68, 82], trend: [74, 76, 78, 77, 80, 79.2] },
  3: { total: 48, avg: 85.1, passRate: 95.8, excellentRate: 37.5, radar: [88, 82, 92, 78, 90], trend: [80, 82, 84, 83, 86, 85.1] },
  4: { total: 40, avg: 77.8, passRate: 85.0, excellentRate: 22.5, radar: [75, 70, 82, 65, 78], trend: [72, 74, 76, 75, 78, 77.8] },
  5: { total: 44, avg: 81.0, passRate: 90.9, excellentRate: 29.5, radar: [82, 76, 88, 70, 85], trend: [76, 78, 80, 79, 82, 81.0] },
};

const current = computed(() => mockData[selectedClass.value] || mockData[1]);

const statCards = computed(() => [
  { label: '总人数', value: current.value.total, bg: 'linear-gradient(135deg, #1a73e8, #4fc3f7)' },
  { label: '平均成绩', value: current.value.avg.toFixed(1), bg: 'linear-gradient(135deg, #00b894, #55efc4)' },
  { label: '及格率', value: current.value.passRate.toFixed(1) + '%', bg: 'linear-gradient(135deg, #f39c12, #f1c40f)' },
  { label: '优秀率', value: current.value.excellentRate.toFixed(1) + '%', bg: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' },
]);

const radarRef = ref<HTMLElement>();
const trendRef = ref<HTMLElement>();
let radarChart: echarts.ECharts;
let trendChart: echarts.ECharts;

const radarIndicators = ['50米跑', '坐位体前屈', '1分钟跳绳', '仰卧起坐', '立定跳远'];

function renderRadar() {
  radarChart.setOption({
    tooltip: {},
    radar: {
      indicator: radarIndicators.map((name) => ({ name, max: 100 })),
      shape: 'polygon',
    },
    series: [{
      type: 'radar',
      data: [{
        value: current.value.radar,
        name: '班级平均',
        areaStyle: { color: 'rgba(26,115,232,0.25)' },
        lineStyle: { color: '#1a73e8' },
        itemStyle: { color: '#1a73e8' },
      }],
    }],
  }, true);
}

function renderTrend() {
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['第1次', '第2次', '第3次', '第4次', '第5次', '第6次'],
    },
    yAxis: { type: 'value', min: 60, max: 100 },
    series: [{
      type: 'line',
      data: current.value.trend,
      smooth: true,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(26,115,232,0.35)' },
        { offset: 1, color: 'rgba(26,115,232,0.05)' },
      ])},
      lineStyle: { color: '#1a73e8', width: 2 },
      itemStyle: { color: '#1a73e8' },
    }],
  }, true);
}

function onClassChange() {
  renderRadar();
  renderTrend();
}

function handleResize() {
  radarChart?.resize();
  trendChart?.resize();
}

onMounted(() => {
  radarChart = echarts.init(radarRef.value!);
  trendChart = echarts.init(trendRef.value!);
  renderRadar();
  renderTrend();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  radarChart?.dispose();
  trendChart?.dispose();
});
</script>

<style scoped>
.class-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a3353;
}

.stat-cards {
  margin: 0;
}

.stat-card {
  border-radius: 12px;
  padding: 24px 20px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.stat-label {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
}

.chart-card {
  min-height: 360px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a3353;
}

.chart-container {
  width: 100%;
  height: 300px;
}
</style>
