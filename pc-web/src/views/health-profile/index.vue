<template>
  <div class="health-profile">
    <div class="page-header">
      <h3 class="page-title">学生体质档案</h3>
      <el-input
        v-model="searchKey"
        placeholder="搜索学生姓名或学号"
        prefix-icon="Search"
        style="width: 260px"
        clearable
        @change="onSearch"
      />
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="info-card">
          <template #header><span class="card-title">基本信息</span></template>
          <div class="info-grid">
            <div class="info-item" v-for="item in infoItems" :key="item.label">
              <span class="info-label">{{ item.label }}</span>
              <span class="info-value">{{ item.value }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="risk-card">
          <template #header>
            <span class="card-title">健康风险提示</span>
          </template>
          <div class="risk-list">
            <el-alert
              v-for="(risk, i) in risks"
              :key="i"
              :title="risk.title"
              :description="risk.desc"
              :type="risk.type"
              show-icon
              :closable="false"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="chart-card">
          <template #header><span class="card-title">体质评分雷达图</span></template>
          <div ref="radarRef" class="chart-container"></div>
        </el-card>

        <el-card>
          <template #header><span class="card-title">历史成绩时间轴</span></template>
          <el-timeline>
            <el-timeline-item
              v-for="record in historyRecords"
              :key="record.date"
              :timestamp="record.date"
              placement="top"
              :type="record.level === '优秀' ? 'success' : record.level === '良好' ? 'primary' : 'warning'"
            >
              <el-card shadow="never" class="timeline-card">
                <div class="timeline-header">
                  <span class="timeline-title">{{ record.exam }}</span>
                  <el-tag :type="record.level === '优秀' ? 'success' : record.level === '良好' ? '' : 'warning'" size="small">
                    {{ record.level }}
                  </el-tag>
                </div>
                <div class="timeline-score">综合评分：{{ record.score }} 分</div>
                <div class="timeline-detail">{{ record.detail }}</div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

const searchKey = ref('');

const infoItems = [
  { label: '姓名', value: '张明轩' },
  { label: '学号', value: '2024010135' },
  { label: '班级', value: '三年级2班' },
  { label: '性别', value: '男' },
  { label: '年龄', value: '9岁' },
  { label: '身高', value: '138 cm' },
  { label: '体重', value: '32.5 kg' },
  { label: 'BMI', value: '17.1（正常）' },
];

const risks = [
  { title: '耐力偏弱', desc: '1000米跑成绩连续2次低于及格线，建议增加有氧训练', type: 'warning' as const },
  { title: '上肢力量不足', desc: '引体向上仅完成2个，低于同龄平均水平', type: 'warning' as const },
  { title: '视力需关注', desc: '近期体检左眼视力下降至4.6，建议就医检查', type: 'error' as const },
];

const historyRecords = [
  { date: '2026-03', exam: '2026年春季体质测试', score: 78.5, level: '良好', detail: '50米跑 8.2s | 跳绳 132次 | 坐位体前屈 12.5cm | 1000米 5\'32"' },
  { date: '2025-10', exam: '2025年秋季体质测试', score: 74.2, level: '及格', detail: '50米跑 8.5s | 跳绳 118次 | 坐位体前屈 11.0cm | 1000米 5\'48"' },
  { date: '2025-03', exam: '2025年春季体质测试', score: 82.1, level: '良好', detail: '50米跑 8.0s | 跳绳 145次 | 坐位体前屈 13.2cm | 1000米 5\'15"' },
  { date: '2024-10', exam: '2024年秋季体质测试', score: 70.8, level: '及格', detail: '50米跑 8.8s | 跳绳 105次 | 坐位体前屈 10.5cm | 1000米 6\'02"' },
];

const radarRef = ref<HTMLElement>();
let radarChart: echarts.ECharts;

function renderChart() {
  radarChart.setOption({
    tooltip: {},
    radar: {
      indicator: [
        { name: '速度', max: 100 },
        { name: '耐力', max: 100 },
        { name: '力量', max: 100 },
        { name: '柔韧', max: 100 },
        { name: '协调', max: 100 },
      ],
      shape: 'polygon',
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [82, 58, 45, 75, 88],
            name: '当前评分',
            areaStyle: { color: 'rgba(26,115,232,0.25)' },
            lineStyle: { color: '#1a73e8' },
            itemStyle: { color: '#1a73e8' },
          },
          {
            value: [78, 72, 68, 70, 80],
            name: '同龄平均',
            areaStyle: { color: 'rgba(0,184,148,0.15)' },
            lineStyle: { color: '#00b894', type: 'dashed' },
            itemStyle: { color: '#00b894' },
          },
        ],
      },
    ],
    legend: { data: ['当前评分', '同龄平均'], bottom: 0 },
  }, true);
}

function onSearch() {
  // 实际使用时调用 API 搜索学生
}

function handleResize() {
  radarChart?.resize();
}

onMounted(() => {
  radarChart = echarts.init(radarRef.value!);
  renderChart();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  radarChart?.dispose();
});
</script>

<style scoped>
.health-profile {
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

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a3353;
}

.info-card {
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 12px;
  color: #8c99a8;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a3353;
}

.risk-card {
  margin-bottom: 16px;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-card {
  min-height: 380px;
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.timeline-card {
  margin-bottom: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.timeline-title {
  font-weight: 600;
  color: #1a3353;
}

.timeline-score {
  font-size: 14px;
  color: #3d4f63;
  margin-bottom: 2px;
}

.timeline-detail {
  font-size: 12px;
  color: #8c99a8;
}
</style>
