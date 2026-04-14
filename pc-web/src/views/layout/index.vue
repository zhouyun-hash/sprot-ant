<template>
  <el-container class="layout">
    <el-aside :width="sidebarWidth" class="sidebar">
      <div class="brand">
        <div class="brand-icon">AI</div>
        <transition name="fade">
          <span v-show="!collapsed" class="brand-text">智慧体育</span>
        </transition>
      </div>

      <el-menu
        :default-active="activePath"
        router
        class="sidebar-menu"
        :collapse="collapsed"
        :collapse-transition="false"
        :default-openeds="visibleGroupKeys"
        background-color="transparent"
        text-color="rgba(255,255,255,0.85)"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>主页</template>
        </el-menu-item>

        <template v-for="group in visibleMenuGroups" :key="group.key">
          <el-sub-menu :index="group.key">
            <template #title>
              <el-icon><component :is="group.icon" /></el-icon>
              <span>{{ group.label }}</span>
            </template>
            <el-menu-item v-for="item in group.children" :key="item.index" :index="item.index">
              {{ item.label }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header" :style="{ height: 'var(--header-height)' }">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Fold v-if="!collapsed" /><Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>管理后台</el-breadcrumb-item>
            <el-breadcrumb-item v-for="(b, idx) in breadcrumbs" :key="idx">{{ b }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ (userStore.user?.name || userStore.user?.username || '?')[0] }}
              </el-avatar>
              <span class="username">{{ userStore.user?.name || userStore.user?.username || '未登录' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  HomeFilled,
  School,
  List,
  DataAnalysis,
  Notebook,
  Setting,
  Monitor,
  Fold,
  Expand,
  ArrowDown,
  SwitchButton,
} from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const collapsed = ref(false);

const sidebarWidth = computed(() => (collapsed.value ? '64px' : '220px'));

interface MenuItem { index: string; label: string; perm?: string }
interface MenuGroup { key: string; label: string; icon: Component; children: MenuItem[] }

const menuGroups: MenuGroup[] = [
  {
    key: 'base-mgmt', label: '基础管理', icon: School,
    children: [
      { index: '/schools', label: '学校管理', perm: 'school:read' },
      { index: '/grades', label: '年级管理', perm: 'grade:read' },
      { index: '/classes', label: '班级管理', perm: 'class:read' },
      { index: '/students', label: '学生管理', perm: 'student:read' },
      { index: '/teachers', label: '教师管理', perm: 'teacher:read' },
      { index: '/venues', label: '场地管理', perm: 'school:read' },
    ],
  },
  {
    key: 'exam-mgmt', label: '体测管理', icon: List,
    children: [
      { index: '/exam-projects', label: '体测项目', perm: 'task:read' },
      { index: '/exam-standards', label: '体测标准', perm: 'task:read' },
      { index: '/exam-plans', label: '体测计划', perm: 'task:read' },
      { index: '/exam-batches', label: '体测批次', perm: 'task:read' },
      { index: '/tasks', label: '体测任务', perm: 'task:read' },
      { index: '/scores', label: '成绩管理', perm: 'score:read' },
      { index: '/score-monitor', label: '成绩监控', perm: 'score:read' },
      { index: '/score-reviews', label: '成绩审核', perm: 'score:review' },
      { index: '/video-playback', label: '视频回放', perm: 'score:read' },
    ],
  },
  {
    key: 'teach-mgmt', label: '教学管理', icon: Notebook,
    children: [
      { index: '/schedule', label: '课表管理', perm: 'homework:read' },
      { index: '/teaching-plans', label: '教学计划', perm: 'homework:read' },
      { index: '/resources', label: '资源库', perm: 'resource:read' },
      { index: '/homework', label: '作业管理', perm: 'homework:read' },
      { index: '/homework-review', label: '作业批改', perm: 'homework:write' },
    ],
  },
  {
    key: 'device-mgmt', label: '设备与AI', icon: Monitor,
    children: [
      { index: '/devices', label: '设备管理', perm: 'system:settings' },
      { index: '/rtsp-streams', label: 'RTSP配置', perm: 'system:settings' },
      { index: '/ai-config', label: 'AI配置', perm: 'system:settings' },
    ],
  },
  {
    key: 'data-center', label: '数据中心', icon: DataAnalysis,
    children: [
      { index: '/dashboard', label: '驾驶舱', perm: 'score:read' },
      { index: '/class-stats', label: '班级运动数据', perm: 'score:read' },
      { index: '/grade-stats', label: '年级统计', perm: 'score:read' },
      { index: '/school-screen', label: '全校大屏', perm: 'score:read' },
      { index: '/compliance-stats', label: '达标率统计', perm: 'score:read' },
      { index: '/weakness-analysis', label: '薄弱分析', perm: 'score:read' },
      { index: '/health-profile', label: '体质档案', perm: 'student:read' },
      { index: '/prescriptions', label: '运动处方', perm: 'student:read' },
      { index: '/alerts', label: '预警管理', perm: 'score:read' },
      { index: '/rank', label: '排行榜', perm: 'score:read' },
    ],
  },
  {
    key: 'sys-mgmt', label: '系统管理', icon: Setting,
    children: [
      { index: '/roles', label: '角色权限', perm: 'role:read' },
      { index: '/accounts', label: '账号管理', perm: 'account:read' },
      { index: '/messages', label: '消息推送', perm: 'system:settings' },
      { index: '/system-log', label: '系统日志', perm: 'audit:read' },
      { index: '/backups', label: '数据备份', perm: 'system:settings' },
      { index: '/open-api', label: '接口配置', perm: 'system:settings' },
      { index: '/sync', label: '教育局对接', perm: 'system:settings' },
      { index: '/parent-messages', label: '家校消息', perm: 'system:settings' },
      { index: '/badges', label: '勋章管理', perm: 'system:settings' },
      { index: '/settings', label: '系统设置', perm: 'system:settings' },
      { index: '/versions', label: '版本管理', perm: 'system:settings' },
      { index: '/help', label: '帮助中心' },
      { index: '/print-templates', label: '打印模板', perm: 'system:settings' },
    ],
  },
];

const visibleMenuGroups = computed(() => {
  return menuGroups
    .map((group) => {
      const filteredChildren = group.children.filter(
        (item) => !item.perm || userStore.hasPermission(item.perm),
      );
      return { ...group, children: filteredChildren };
    })
    .filter((group) => group.children.length > 0);
});

const visibleGroupKeys = computed(() => visibleMenuGroups.value.map((g) => g.key));

const allVisiblePaths = computed(() => {
  const paths = ['/'];
  for (const group of visibleMenuGroups.value) {
    for (const item of group.children) {
      paths.push(item.index);
    }
  }
  return paths;
});

const activePath = computed(() => {
  const p = route.path;
  const match = allVisiblePaths.value.find((m) => m !== '/' && p.startsWith(m));
  return match || '/';
});

const breadcrumbs = computed(() => {
  const title = (route.meta.title as string) || '页面';
  return [title];
});

function logout() {
  userStore.logout();
  router.replace('/login');
}
</script>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
}

/* ── 侧栏 ── */
.sidebar {
  background: var(--sidebar-bg);
  transition: width 0.25s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.brand {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--brand-gradient);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-text {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  white-space: nowrap;
}

.sidebar-menu {
  border-right: none !important;
  background: transparent !important;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}

.sidebar-menu::-webkit-scrollbar {
  width: 4px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
}

.sidebar-menu .el-menu-item {
  color: var(--sidebar-text);
  height: 44px;
  line-height: 44px;
  margin: 2px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.sidebar-menu .el-menu-item:hover {
  background: var(--sidebar-item-hover);
}

.sidebar-menu .el-menu-item.is-active {
  background: var(--sidebar-item-active) !important;
  color: var(--sidebar-text-active);
  font-weight: 600;
}

.sidebar-menu .el-menu-item .el-icon {
  color: inherit;
}

/* ── 子菜单组 ── */
.sidebar-menu :deep(.el-sub-menu__title) {
  height: 44px;
  line-height: 44px;
  margin: 2px 8px;
  border-radius: 6px;
}

.sidebar-menu :deep(.el-sub-menu .el-menu) {
  background-color: rgba(0, 0, 0, 0.15) !important;
}

.sidebar-menu :deep(.el-sub-menu .el-menu .el-menu-item) {
  padding-left: 52px !important;
  height: 40px;
  line-height: 40px;
  font-size: 13px;
  margin: 2px 8px;
  border-radius: 6px;
}

/* ── 主区域 ── */
.main-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.header {
  background: var(--header-bg);
  box-shadow: var(--header-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 10;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #4a5568;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: var(--brand-primary);
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #4a5568;
  font-size: 14px;
}

.user-avatar {
  background: var(--brand-gradient);
  color: #fff;
  font-weight: 600;
}

.username {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 内容区 ── */
.content {
  background: var(--bg-page);
  overflow-y: auto;
  padding: 20px;
}

/* ── 动画 ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
