<template>
  <div class="login-page">
    <div class="login-brand">
      <div class="brand-content">
        <div class="brand-logo">AI</div>
        <h1 class="brand-title">AI 智慧体育平台</h1>
        <p class="brand-subtitle">中小学 AI 智慧体育一体化管理系统</p>
        <div class="brand-features">
          <div class="feature-item">
            <div class="feature-dot"></div>
            <span>AI 动作识别与智能评分</span>
          </div>
          <div class="feature-item">
            <div class="feature-dot"></div>
            <span>体质测试全流程管理</span>
          </div>
          <div class="feature-item">
            <div class="feature-dot"></div>
            <span>多维度数据驾驶舱</span>
          </div>
          <div class="feature-item">
            <div class="feature-dot"></div>
            <span>教—学—评—练—管 闭环</span>
          </div>
        </div>
      </div>
      <div class="brand-footer">&copy; {{ new Date().getFullYear() }} 智慧体育 &middot; 赋能体育教学</div>
    </div>

    <div class="login-form-area">
      <div class="form-wrapper">
        <h2 class="form-title">管理后台登录</h2>
        <p class="form-desc">请输入账号密码进入系统</p>

        <el-form :model="form" label-position="top" @submit.prevent="onSubmit" class="login-form">
          <el-form-item label="账号">
            <el-input
              v-model="form.username"
              placeholder="请输入账号"
              clearable
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
            />
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="onSubmit"
            class="login-btn"
          >
            登 录
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const loading = ref(false);
const form = reactive({ username: '', password: '' });

async function onSubmit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  loading.value = true;
  try {
    await userStore.login({ username: form.username, password: form.password });
    ElMessage.success('登录成功');
    const redirect = (route.query.redirect as string) || '/';
    router.replace(redirect);
  } catch (e: unknown) {
    const ax = e as {
      response?: { data?: { message?: string | string[] } };
      message?: string;
    };
    const serverMsg = ax.response?.data?.message;
    const text =
      (typeof serverMsg === 'string' && serverMsg) ||
      (Array.isArray(serverMsg) && serverMsg.join('; ')) ||
      (e instanceof Error && e.message) ||
      '登录失败';
    ElMessage.error(text);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
}

/* ── 左侧品牌区 ── */
.login-brand {
  flex: 0 0 480px;
  background: linear-gradient(160deg, #0d1b3e 0%, #1565c0 50%, #4fc3f7 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 48px;
  position: relative;
  overflow: hidden;
}

.login-brand::before {
  content: '';
  position: absolute;
  top: -120px;
  right: -120px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
}

.login-brand::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: -80px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
}

.brand-content {
  position: relative;
  z-index: 1;
}

.brand-logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 24px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}

.brand-title {
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px;
  letter-spacing: 2px;
}

.brand-subtitle {
  color: rgba(255, 255, 255, 0.75);
  font-size: 15px;
  margin: 0 0 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
}

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4fc3f7;
  flex-shrink: 0;
}

.brand-footer {
  position: absolute;
  bottom: 32px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  z-index: 1;
}

/* ── 右侧表单区 ── */
.login-form-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fb;
  padding: 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.form-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #1a3353;
}

.form-desc {
  margin: 0 0 32px;
  font-size: 14px;
  color: #8c99a8;
}

.login-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #4a5568;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 8px;
  background: linear-gradient(135deg, #1a73e8, #4a9af5);
  border: none;
  letter-spacing: 4px;
}

.login-btn:hover {
  background: linear-gradient(135deg, #155cc0, #3d8ce0);
}

@media (max-width: 960px) {
  .login-brand {
    display: none;
  }
}
</style>
