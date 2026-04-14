<template>
  <div class="school-screen" ref="screenRef">
    <div class="screen-header">
      <h2 class="screen-title">全校体质健康数据大屏</h2>
      <el-button type="primary" plain size="small" @click="toggleFullscreen">
        {{ isFullscreen ? '退出全屏' : '全屏模式' }}
      </el-button>
    </div>

    <div class="kpi-grid">
      <div v-for="kpi in kpiList" :key="kpi.label" class="kpi-item" :style="{ borderTopColor: kpi.color }">
        <div class="kpi-number" :style="{ color: kpi.color }">{{ kpi.value }}</div>
        <div class="kpi-label">{{ kpi.label }}</div>
      </div>
    </div>

    <div class="main-chart-wrapper">
      <div class="chart-title">各年级及格率对比</div>
      <div ref="mainChartRef" class="main-chart"></div>
    </div>

    <div class="scroll-bar">
      <div class="scroll-content" ref="scrollRef">
        <span v-for="(msg, i) in scrollMessages" :key="i" class="scroll-item">{{ msg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

const screenRef = ref<HTMLElement>();
const isFullscreen = ref(false);

const kpiList = [
  { label: '总学生数', value: '3,256', color: '#4fc3f7' },
  { label: '总教师数', value: '128', color: '#81c784' },
  { label: '测试完成率', value: '96.2%', color: '#ffb74d' },
  { label: '及格率', value: '91.8%', color: '#1a73e8' },
  { label: '优秀率', value: '28.5%', color: '#ab47bc' },
  { label: '预警数', value: '17', color: '#ef5350' },
];

const scrollMessages = [
  '【系统通知】2026年春季体质测试已全部完成，数据正在汇总中',
  '【预警提示】三年级2班体测及格率低于85%，请关注',
  '【教学动态】本周新增15份运动处方，覆盖42名学生',
  '【成绩速报】一年级平均成绩较上学期提升3.2分',
  '【设备状态】所有摄像头与边缘盒子运行正常',
];

const mainChartRef = ref<HTMLElement>();
let mainChart: echarts.ECharts;

function renderChart() {
  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
  const passRates = [93.2, 91.5, 89.8, 94.1, 90.3, 92.7];

  mainChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: grades, axisLabel: { color: '#aec5dd' }, axisLine: { lineStyle: { color: '#2a4a6b' } } },
    yAxis: { type: 'value', min: 80, max: 100, axisLabel: { color: '#aec5dd', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#1e3a5a' } } },
    grid: { left: 60, right: 30, top: 20, bottom: 40 },
    series: [{
      type: 'bar',
      data: passRates,
      barWidth: 40,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#4fc3f7' },
          { offset: 1, color: '#1a73e8' },
        ]),
        borderRadius: [6, 6, 0, 0],
      },
      label: { show: true, position: 'top', formatter: '{c}%', color: '#aec5dd', fontSize: 12 },
    }],
  }, true);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    screenRef.value?.requestFullscreen?.();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen?.();
    isFullscreen.value = false;
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  mainChart?.resize();
}

const scrollRef = ref<HTMLElement>();
let scrollTimer: ReturnType<typeof setInterval>;

function startScroll() {
  scrollTimer = setInterval(() => {
    if (!scrollRef.value) return;
    scrollRef.value.scrollLeft += 1;
    if (scrollRef.value.scrollLeft >= scrollRef.value.scrollWidth - scrollRef.value.clientWidth) {
      scrollRef.value.scrollLeft = 0;
    }
  }, 30);
}

function handleResize() {
  mainChart?.resize();
}

onMounted(() => {
  mainChart = echarts.init(mainChartRef.value!);
  renderChart();
  startScroll();
  document.addEventListener('fullscreenchange', onFullscreenChange);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  clearInterval(scrollTimer);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  window.removeEventListener('resize', handleResize);
  mainChart?.dispose();
});
</script>

<style scoped>
.school-screen {
  background: linear-gradient(180deg, #0a1628, #0f2240);
  min-height: 100vh;
  padding: 24px 32px;
  color: #d0e4f7;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.screen-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(90deg, #4fc3f7, #81d4fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.kpi-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 3px solid;
  border-radius: 10px;
  padding: 20px 16px;
  text-align: center;
}

.kpi-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
}

.kpi-label {
  font-size: 12px;
  color: #7fa3c7;
  margin-top: 6px;
}

.main-chart-wrapper {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #8bb8d8;
  margin-bottom: 8px;
}

.main-chart {
  flex: 1;
  min-height: 300px;
}

.scroll-bar {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 10px 16px;
  overflow: hidden;
}

.scroll-content {
  display: flex;
  gap: 60px;
  white-space: nowrap;
  overflow-x: hidden;
}

.scroll-item {
  font-size: 13px;
  color: #7fa3c7;
  flex-shrink: 0;
}
</style>
