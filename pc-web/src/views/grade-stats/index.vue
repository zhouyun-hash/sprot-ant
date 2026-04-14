<template>
  <div class="grade-stats">
    <div class="page-header">
      <h3 class="page-title">年级数据统计</h3>
      <el-select v-model="selectedGrade" placeholder="选择年级" style="width: 180px" @change="onGradeChange">
        <el-option v-for="g in gradeList" :key="g.id" :label="g.name" :value="g.id" />
      </el-select>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header><span class="card-title">班级对比（平均分）</span></template>
          <div ref="barRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header><span class="card-title">近6次考试趋势</span></template>
          <div ref="lineRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card">
      <template #header><span class="card-title">班级明细</span></template>
      <el-table :data="currentData.classes" stripe>
        <el-table-column prop="name" label="班级" />
        <el-table-column prop="avg" label="平均分" />
        <el-table-column prop="passRate" label="及格率">
          <template #default="{ row }">{{ row.passRate }}%</template>
        </el-table-column>
        <el-table-column prop="excellentRate" label="优秀率">
          <template #default="{ row }">{{ row.excellentRate }}%</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

interface ClassItem {
  name: string;
  avg: number;
  passRate: number;
  excellentRate: number;
}

interface GradeData {
  classes: ClassItem[];
  trend: number[];
}

const gradeList = [
  { id: 1, name: '一年级' },
  { id: 2, name: '二年级' },
  { id: 3, name: '三年级' },
];

const selectedGrade = ref(1);

const mockGradeData: Record<number, GradeData> = {
  1: {
    classes: [
      { name: '1班', avg: 82.5, passRate: 93.3, excellentRate: 31.1 },
      { name: '2班', avg: 79.2, passRate: 88.1, excellentRate: 26.2 },
      { name: '3班', avg: 84.0, passRate: 94.5, excellentRate: 33.0 },
      { name: '4班', avg: 77.8, passRate: 85.0, excellentRate: 22.5 },
    ],
    trend: [78, 79, 80, 81, 82, 81],
  },
  2: {
    classes: [
      { name: '1班', avg: 85.1, passRate: 95.8, excellentRate: 37.5 },
      { name: '2班', avg: 81.0, passRate: 90.9, excellentRate: 29.5 },
      { name: '3班', avg: 83.2, passRate: 92.1, excellentRate: 32.0 },
    ],
    trend: [80, 81, 83, 84, 85, 83],
  },
  3: {
    classes: [
      { name: '1班', avg: 80.3, passRate: 91.2, excellentRate: 28.0 },
      { name: '2班', avg: 76.5, passRate: 84.3, excellentRate: 20.0 },
      { name: '3班', avg: 82.8, passRate: 93.0, excellentRate: 35.0 },
      { name: '4班', avg: 79.0, passRate: 88.0, excellentRate: 25.0 },
      { name: '5班', avg: 81.5, passRate: 90.5, excellentRate: 30.0 },
    ],
    trend: [75, 77, 78, 79, 80, 80],
  },
};

const currentData = computed(() => mockGradeData[selectedGrade.value] || mockGradeData[1]);

const barRef = ref<HTMLElement>();
const lineRef = ref<HTMLElement>();
let barChart: echarts.ECharts;
let lineChart: echarts.ECharts;

function renderBar() {
  const cls = currentData.value.classes;
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: cls.map((c) => c.name) },
    yAxis: { type: 'value', min: 60, max: 100 },
    series: [{
      type: 'bar',
      data: cls.map((c) => c.avg),
      barWidth: 36,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#1a73e8' },
          { offset: 1, color: '#4fc3f7' },
        ]),
        borderRadius: [6, 6, 0, 0],
      },
    }],
  }, true);
}

function renderLine() {
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['第1次', '第2次', '第3次', '第4次', '第5次', '第6次'] },
    yAxis: { type: 'value', min: 60, max: 100 },
    series: [{
      type: 'line',
      data: currentData.value.trend,
      smooth: true,
      lineStyle: { color: '#00b894', width: 2 },
      itemStyle: { color: '#00b894' },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(0,184,148,0.3)' },
        { offset: 1, color: 'rgba(0,184,148,0.05)' },
      ])},
    }],
  }, true);
}

function onGradeChange() {
  renderBar();
  renderLine();
}

function handleResize() {
  barChart?.resize();
  lineChart?.resize();
}

onMounted(() => {
  barChart = echarts.init(barRef.value!);
  lineChart = echarts.init(lineRef.value!);
  renderBar();
  renderLine();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  barChart?.dispose();
  lineChart?.dispose();
});
</script>

<style scoped>
.grade-stats {
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
