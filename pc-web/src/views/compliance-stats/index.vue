<template>
  <div class="compliance-stats">
    <h3 class="page-title">达标率统计</h3>

    <el-row :gutter="16" class="summary-row">
      <el-col :span="6" v-for="card in summaryCards" :key="card.label">
        <div class="summary-card" :style="{ background: card.bg }">
          <div class="summary-label">{{ card.label }}</div>
          <div class="summary-value">{{ card.value }}</div>
        </div>
      </el-col>
    </el-row>

    <el-card class="chart-card">
      <template #header><span class="card-title">各项目达标率</span></template>
      <div ref="barRef" class="chart-container"></div>
    </el-card>

    <el-card>
      <template #header><span class="card-title">各年级达标率明细</span></template>
      <el-table :data="gradeTable" stripe>
        <el-table-column prop="grade" label="年级" width="120" />
        <el-table-column prop="total" label="总人数" width="100" />
        <el-table-column prop="passCount" label="达标人数" width="100" />
        <el-table-column prop="passRate" label="达标率">
          <template #default="{ row }">
            <el-progress :percentage="row.passRate" :stroke-width="14" :text-inside="true"
              :color="row.passRate >= 90 ? '#00b894' : row.passRate >= 80 ? '#f39c12' : '#e74c3c'" />
          </template>
        </el-table-column>
        <el-table-column prop="excellentRate" label="优秀率">
          <template #default="{ row }">{{ row.excellentRate }}%</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

const summaryCards = [
  { label: '总体达标率', value: '91.8%', bg: 'linear-gradient(135deg, #1a73e8, #4fc3f7)' },
  { label: '优秀率', value: '28.5%', bg: 'linear-gradient(135deg, #00b894, #55efc4)' },
  { label: '良好率', value: '34.2%', bg: 'linear-gradient(135deg, #f39c12, #f1c40f)' },
  { label: '不及格率', value: '8.2%', bg: 'linear-gradient(135deg, #e74c3c, #e57373)' },
];

const projectData = [
  { name: '50米跑', rate: 94.5 },
  { name: '坐位体前屈', rate: 88.3 },
  { name: '1分钟跳绳', rate: 92.1 },
  { name: '仰卧起坐', rate: 85.7 },
  { name: '立定跳远', rate: 90.6 },
  { name: '引体向上', rate: 78.2 },
  { name: '1000米跑', rate: 83.4 },
  { name: '800米跑', rate: 86.1 },
];

const gradeTable = [
  { grade: '一年级', total: 520, passCount: 486, passRate: 93.5, excellentRate: 32.0 },
  { grade: '二年级', total: 498, passCount: 460, passRate: 92.4, excellentRate: 30.1 },
  { grade: '三年级', total: 545, passCount: 498, passRate: 91.4, excellentRate: 28.5 },
  { grade: '四年级', total: 530, passCount: 479, passRate: 90.4, excellentRate: 26.8 },
  { grade: '五年级', total: 510, passCount: 458, passRate: 89.8, excellentRate: 25.2 },
  { grade: '六年级', total: 553, passCount: 512, passRate: 92.6, excellentRate: 29.8 },
];

const barRef = ref<HTMLElement>();
let barChart: echarts.ECharts;

function renderChart() {
  barChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    xAxis: { type: 'category', data: projectData.map((p) => p.name), axisLabel: { rotate: 15 } },
    yAxis: { type: 'value', min: 70, max: 100, axisLabel: { formatter: '{value}%' } },
    grid: { left: 60, right: 20, bottom: 50, top: 20 },
    series: [{
      type: 'bar',
      data: projectData.map((p) => ({
        value: p.rate,
        itemStyle: {
          color: p.rate >= 90 ? '#00b894' : p.rate >= 85 ? '#f39c12' : '#e74c3c',
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barWidth: 36,
    }],
  }, true);
}

function handleResize() {
  barChart?.resize();
}

onMounted(() => {
  barChart = echarts.init(barRef.value!);
  renderChart();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  barChart?.dispose();
});
</script>

<style scoped>
.compliance-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a3353;
}

.summary-row {
  margin: 0;
}

.summary-card {
  border-radius: 12px;
  padding: 24px 20px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.summary-label {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 8px;
}

.summary-value {
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
