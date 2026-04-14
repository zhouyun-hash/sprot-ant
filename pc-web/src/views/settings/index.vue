<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>系统设置</span>
      </div>
    </template>

    <el-tabs v-model="activeTab" @tab-change="loadTab">
      <el-tab-pane label="基础设置" name="basic">
        <el-form :model="basicForm" label-width="140px" style="max-width:600px" v-loading="loading">
          <el-form-item label="系统名称"><el-input v-model="basicForm.systemName" /></el-form-item>
          <el-form-item label="学校名称"><el-input v-model="basicForm.schoolName" /></el-form-item>
          <el-form-item label="Logo URL"><el-input v-model="basicForm.logoUrl" /></el-form-item>
          <el-form-item label="联系电话"><el-input v-model="basicForm.contactPhone" /></el-form-item>
          <el-form-item label="系统公告"><el-input v-model="basicForm.announcement" type="textarea" :rows="3" /></el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveGroup('basic', basicForm)">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="体测设置" name="exam">
        <el-form :model="examForm" label-width="140px" style="max-width:600px" v-loading="loading">
          <el-form-item label="默认评分标准"><el-input v-model="examForm.defaultStandard" /></el-form-item>
          <el-form-item label="成绩保留小数位">
            <el-input-number v-model="examForm.decimalPlaces" :min="0" :max="4" />
          </el-form-item>
          <el-form-item label="允许补测">
            <el-switch v-model="examForm.allowRetest" />
          </el-form-item>
          <el-form-item label="补测最大次数">
            <el-input-number v-model="examForm.retestMaxTimes" :min="1" :max="10" />
          </el-form-item>
          <el-form-item label="视频保留天数">
            <el-input-number v-model="examForm.videoRetentionDays" :min="7" :max="365" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveGroup('exam', examForm)">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="安全设置" name="security">
        <el-form :model="securityForm" label-width="140px" style="max-width:600px" v-loading="loading">
          <el-form-item label="密码最小长度">
            <el-input-number v-model="securityForm.passwordMinLength" :min="6" :max="20" />
          </el-form-item>
          <el-form-item label="登录失败锁定次数">
            <el-input-number v-model="securityForm.loginFailLock" :min="3" :max="20" />
          </el-form-item>
          <el-form-item label="会话超时(分钟)">
            <el-input-number v-model="securityForm.sessionTimeout" :min="10" :max="1440" />
          </el-form-item>
          <el-form-item label="强制修改密码(天)">
            <el-input-number v-model="securityForm.passwordExpireDays" :min="0" :max="365" />
          </el-form-item>
          <el-form-item label="启用双因素认证">
            <el-switch v-model="securityForm.enable2FA" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveGroup('security', securityForm)">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const activeTab = ref('basic');
const loading = ref(false);
const saving = ref(false);

const basicForm = reactive({
  systemName: '',
  schoolName: '',
  logoUrl: '',
  contactPhone: '',
  announcement: '',
});

const examForm = reactive({
  defaultStandard: '',
  decimalPlaces: 1,
  allowRetest: true,
  retestMaxTimes: 3,
  videoRetentionDays: 90,
});

const securityForm = reactive({
  passwordMinLength: 8,
  loginFailLock: 5,
  sessionTimeout: 60,
  passwordExpireDays: 0,
  enable2FA: false,
});

function applyConfigs(group: string, configs: Record<string, string>) {
  const g = group + '.';
  const get = (key: string) => configs[g + key] ?? '';
  if (group === 'basic') {
    basicForm.systemName = get('system_name');
    basicForm.schoolName = get('school_name');
    basicForm.logoUrl = get('logo_url');
    basicForm.contactPhone = get('contact_phone');
    basicForm.announcement = get('announcement');
  } else if (group === 'exam') {
    examForm.defaultStandard = get('default_standard');
    examForm.decimalPlaces = Number(get('decimal_places')) || 1;
    examForm.allowRetest = get('allow_retest') !== 'false';
    examForm.retestMaxTimes = Number(get('retest_max_times')) || 3;
    examForm.videoRetentionDays = Number(get('video_retention_days')) || 90;
  } else if (group === 'security') {
    securityForm.passwordMinLength = Number(get('password_min_length')) || 8;
    securityForm.loginFailLock = Number(get('login_fail_lock')) || 5;
    securityForm.sessionTimeout = Number(get('session_timeout')) || 60;
    securityForm.passwordExpireDays = Number(get('password_expire_days')) || 0;
    securityForm.enable2FA = get('enable_2fa') === 'true';
  }
}

async function loadTab(tab?: string) {
  const group = tab || activeTab.value;
  loading.value = true;
  try {
    const { data } = await request.get('/system-configs', { params: { group } });
    const configs: Record<string, string> = {};
    (data.rows ?? data.items ?? data ?? []).forEach((item: any) => {
      configs[item.key] = item.value;
    });
    applyConfigs(group, configs);
  } finally {
    loading.value = false;
  }
}

async function saveGroup(group: string, formData: Record<string, any>) {
  saving.value = true;
  try {
    const items = Object.entries(formData).map(([key, value]) => ({
      key: `${group}.${key.replace(/[A-Z]/g, c => '_' + c.toLowerCase())}`,
      value: String(value),
    }));
    await request.put('/system-configs', { group, items });
    ElMessage.success('保存成功');
  } finally {
    saving.value = false;
  }
}

onMounted(() => loadTab());
</script>
