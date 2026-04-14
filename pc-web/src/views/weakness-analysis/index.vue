<template>
  <div class="weakness-analysis">
    <h3 class="page-title">项目薄弱分析</h3>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card>
          <template #header><span class="card-title">薄弱项目排行（按及格率从低到高）</span></template>
          <div class="project-list">
            <div v-for="(item, idx) in sortedProjects" :key="item.name" class="project-item">
              <div class="project-rank" :class="{ 'rank-danger': idx < 3 }">{{ idx + 1 }}</div>
              <div class="project-info">
                <div class="project-name">{{ item.name }}</div>
                <el-progress
                  :percentage="item.passRate"
                  :stroke-width="16"
                  :text-inside="true"
                  :color="getColor(item.passRate)"
                />
                <div class="project-desc">{{ item.desc }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="chart-card">
          <template #header><span class="card-title">薄弱项分布</span></template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>

        <el-card class="suggest-card">
          <template #header><span class="card-title">改进建议</span></template>
          <div class="suggestions">
            <div v-for="(s, i) in suggestions" :key="i" class="suggest-item">
              <el-tag :type="s.type" size="small" effect="dark">{{ s.tag }}</el-tag>
              <span class="suggest-text">{{ s.text }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

interface ProjectItem {
  name: string;
  passRate: number;
  desc: string;
}

const projects: ProjectItem[] = [
  { name: '引体向上', passRate: 68.2, desc: '上肢力量普遍薄弱，建议增加悬垂、俯卧撑等专项训练' },
  { name: '1000米跑', passRate: 76.4, desc: '耐力项目偏弱，建议每周增加2次有氧跑训练' },
  { name: '800米跑', passRate: 79.1, desc: '女生耐力需加强，建议增加间歇跑训练' },
  { name: '仰卧起坐', passRate: 82.7, desc: '核心力量有一定基础，建议加入平板支撑辅助' },
  { name: '坐位体前屈', passRate: 85.3, desc: '柔韧性尚可，每日课前拉伸可进一步提升' },
  { name: '立定跳远', passRate: 88.6, desc: '下肢爆发力良好，可通过深蹲跳进一步强化' },
  { name: '1分钟跳绳', passRate: 91.2, desc: '协调性项目表现优秀，继续保持' },
  { name: '50米跑', passRate: 94.5, desc: '速度项目达标率高，保持日常训练即可' },
];

const sortedProjects = computed(() => [...projects].sort((a, b) => a.passRate - b.passRate));

const suggestions = [
  { tag: '重点关注', type: 'danger' as const, text: '引体向上及格率仅68.2%，建议制定专项提升计划，每周至少3次上肢力量训练' },
  { tag: '需要加强', type: 'warning' as const, text: '1000米/800米耐力项目偏弱，建议将有氧训练纳入常规课程' },
  { tag: '持续改进', type: 'info' as const, text: '仰卧起坐与坐位体前屈处于中等水平，课前热身可加入针对性练习' },
  { tag: '保持优势', type: 'success' as const, text: '跳绳与50米跑达标率较高，保持现有训练强度' },
];

function getColor(rate: number) {
  if (rate < 75) return '#e74c3c';
  if (rate < 85) return '#f39c12';
  return '#00b894';
}

const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts;

function renderChart() {
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}%', fontSize: 11 },
      data: sortedProjects.value.slice(0, 5).map((p) => ({
        value: (100 - p.passRate).toFixed(1),
        name: p.name,
      })),
    }],
    color: ['#e74c3c', '#e57373', '#f39c12', '#f1c40f', '#ffb74d'],
  }, true);
}

function handleResize() {
  chart?.resize();
}

onMounted(() => {
  chart = echarts.init(chartRef.value!);
  renderChart();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chart?.dispose();
});
</script>

<style scoped>
.weakness-analysis {
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

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a3353;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.project-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8ecf1;
  color: #5a6b80;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.project-rank.rank-danger {
  background: #fde8e8;
  color: #e74c3c;
}

.project-info {
  flex: 1;
}

.project-name {
  font-weight: 600;
  color: #1a3353;
  margin-bottom: 6px;
}

.project-desc {
  font-size: 12px;
  color: #8c99a8;
  margin-top: 4px;
}

.chart-card {
  min-height: 340px;
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.suggest-card {
  min-height: 200px;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.suggest-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.suggest-text {
  font-size: 13px;
  color: #3d4f63;
  line-height: 1.5;
}
</style>
