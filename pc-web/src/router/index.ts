import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Layout from '@/views/layout/index.vue';
import LoginView from '@/views/login/index.vue';
import { useUserStore } from '@/store/user';

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: LoginView, meta: { title: '登录', public: true } },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/home/index.vue'), meta: { title: '主页' } },
      // 基础管理
      { path: 'schools', name: 'schools', component: () => import('@/views/school/index.vue'), meta: { title: '学校管理', perm: 'school:read' } },
      { path: 'grades', name: 'grades', component: () => import('@/views/grade/index.vue'), meta: { title: '年级管理', perm: 'grade:read' } },
      { path: 'classes', name: 'classes', component: () => import('@/views/class/index.vue'), meta: { title: '班级管理', perm: 'class:read' } },
      { path: 'students', name: 'students', component: () => import('@/views/student/index.vue'), meta: { title: '学生管理', perm: 'student:read' } },
      { path: 'teachers', name: 'teachers', component: () => import('@/views/teacher/index.vue'), meta: { title: '教师管理', perm: 'teacher:read' } },
      { path: 'venues', name: 'venues', component: () => import('@/views/venue/index.vue'), meta: { title: '场地管理', perm: 'school:read' } },
      // 体测管理
      { path: 'tasks', name: 'tasks', component: () => import('@/views/task/index.vue'), meta: { title: '体测任务', perm: 'task:read' } },
      { path: 'tasks/:taskId/score', name: 'task-score', component: () => import('@/views/task/score.vue'), meta: { title: '任务成绩详情', perm: 'score:read' } },
      { path: 'scores', name: 'scores', component: () => import('@/views/scores/index.vue'), meta: { title: '成绩管理', perm: 'score:read' } },
      { path: 'exam-projects', name: 'exam-projects', component: () => import('@/views/exam-project/index.vue'), meta: { title: '体测项目', perm: 'task:read' } },
      { path: 'exam-standards', name: 'exam-standards', component: () => import('@/views/exam-standard/index.vue'), meta: { title: '体测标准', perm: 'task:read' } },
      { path: 'exam-plans', name: 'exam-plans', component: () => import('@/views/exam-plan/index.vue'), meta: { title: '体测计划', perm: 'task:read' } },
      { path: 'exam-batches', name: 'exam-batches', component: () => import('@/views/exam-batch/index.vue'), meta: { title: '体测批次', perm: 'task:read' } },
      { path: 'score-monitor', name: 'score-monitor', component: () => import('@/views/score-monitor/index.vue'), meta: { title: '成绩监控', perm: 'score:read' } },
      { path: 'score-reviews', name: 'score-reviews', component: () => import('@/views/score-review/index.vue'), meta: { title: '成绩审核', perm: 'score:review' } },
      { path: 'video-playback', name: 'video-playback', component: () => import('@/views/video-playback/index.vue'), meta: { title: '视频回放', perm: 'score:read' } },
      // 教学管理
      { path: 'homework', name: 'homework', component: () => import('@/views/homework/index.vue'), meta: { title: '作业管理', perm: 'homework:read' } },
      { path: 'homework/:homeworkId/submissions', name: 'homework-submissions', component: () => import('@/views/homework/submission.vue'), meta: { title: '提交详情', perm: 'homework:read' } },
      { path: 'homework-review', name: 'homework-review', component: () => import('@/views/homework-review/index.vue'), meta: { title: '作业批改', perm: 'homework:write' } },
      { path: 'schedule', name: 'schedule', component: () => import('@/views/schedule/index.vue'), meta: { title: '课表管理', perm: 'homework:read' } },
      { path: 'teaching-plans', name: 'teaching-plans', component: () => import('@/views/teaching-plan/index.vue'), meta: { title: '教学计划', perm: 'homework:read' } },
      { path: 'resources', name: 'resources', component: () => import('@/views/resource/index.vue'), meta: { title: '资源库', perm: 'resource:read' } },
      // 设备与AI
      { path: 'devices', name: 'devices', component: () => import('@/views/device/index.vue'), meta: { title: '设备管理', perm: 'system:settings' } },
      { path: 'rtsp-streams', name: 'rtsp-streams', component: () => import('@/views/rtsp/index.vue'), meta: { title: 'RTSP配置', perm: 'system:settings' } },
      { path: 'ai-config', name: 'ai-config', component: () => import('@/views/ai-config/index.vue'), meta: { title: 'AI配置', perm: 'system:settings' } },
      // 数据中心
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '驾驶舱', perm: 'score:read' } },
      { path: 'class-stats', name: 'class-stats', component: () => import('@/views/class-stats/index.vue'), meta: { title: '班级运动数据', perm: 'score:read' } },
      { path: 'grade-stats', name: 'grade-stats', component: () => import('@/views/grade-stats/index.vue'), meta: { title: '年级统计', perm: 'score:read' } },
      { path: 'school-screen', name: 'school-screen', component: () => import('@/views/school-screen/index.vue'), meta: { title: '全校大屏', perm: 'score:read' } },
      { path: 'compliance-stats', name: 'compliance-stats', component: () => import('@/views/compliance-stats/index.vue'), meta: { title: '达标率统计', perm: 'score:read' } },
      { path: 'weakness-analysis', name: 'weakness-analysis', component: () => import('@/views/weakness-analysis/index.vue'), meta: { title: '薄弱分析', perm: 'score:read' } },
      { path: 'health-profile', name: 'health-profile', component: () => import('@/views/health-profile/index.vue'), meta: { title: '体质档案', perm: 'student:read' } },
      { path: 'prescriptions', name: 'prescriptions', component: () => import('@/views/prescription/index.vue'), meta: { title: '运动处方', perm: 'student:read' } },
      { path: 'alerts', name: 'alerts', component: () => import('@/views/alerts/index.vue'), meta: { title: '预警管理', perm: 'score:read' } },
      { path: 'rank', name: 'rank', component: () => import('@/views/rank/index.vue'), meta: { title: '排行榜', perm: 'score:read' } },
      // 系统管理
      { path: 'roles', name: 'roles', component: () => import('@/views/role/index.vue'), meta: { title: '角色权限', perm: 'role:read' } },
      { path: 'accounts', name: 'accounts', component: () => import('@/views/account/index.vue'), meta: { title: '账号管理', perm: 'account:read' } },
      { path: 'messages', name: 'messages', component: () => import('@/views/message/index.vue'), meta: { title: '消息推送', perm: 'system:settings' } },
      { path: 'system-log', name: 'system-log', component: () => import('@/views/system-log/index.vue'), meta: { title: '系统日志', perm: 'audit:read' } },
      { path: 'backups', name: 'backups', component: () => import('@/views/backup/index.vue'), meta: { title: '数据备份', perm: 'system:settings' } },
      { path: 'open-api', name: 'open-api', component: () => import('@/views/open-api/index.vue'), meta: { title: '接口配置', perm: 'system:settings' } },
      { path: 'sync', name: 'sync', component: () => import('@/views/sync/index.vue'), meta: { title: '教育局对接', perm: 'system:settings' } },
      { path: 'parent-messages', name: 'parent-messages', component: () => import('@/views/parent-message/index.vue'), meta: { title: '家校消息', perm: 'system:settings' } },
      { path: 'badges', name: 'badges', component: () => import('@/views/badge/index.vue'), meta: { title: '勋章管理', perm: 'system:settings' } },
      { path: 'settings', name: 'settings', component: () => import('@/views/settings/index.vue'), meta: { title: '系统设置', perm: 'system:settings' } },
      { path: 'versions', name: 'versions', component: () => import('@/views/version/index.vue'), meta: { title: '版本管理', perm: 'system:settings' } },
      { path: 'help', name: 'help', component: () => import('@/views/help/index.vue'), meta: { title: '帮助中心' } },
      { path: 'print-templates', name: 'print-templates', component: () => import('@/views/print-template/index.vue'), meta: { title: '打印模板', perm: 'system:settings' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  document.title = `${(to.meta.title as string) || '后台'} - 智慧体育`;
  if (to.meta.public) {
    next();
    return;
  }
  if (!userStore.token) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }
  const requiredPerm = to.meta.perm as string | undefined;
  if (requiredPerm && !userStore.hasPermission(requiredPerm)) {
    next({ path: '/' });
    return;
  }
  next();
});

export default router;
