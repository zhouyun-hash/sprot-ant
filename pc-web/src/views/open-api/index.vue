<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>接口配置</span>
      </div>
    </template>

    <el-form :model="form" label-width="120px" style="max-width:640px" v-loading="loading">
      <el-form-item label="API 密钥">
        <el-input v-model="form.apiKey" placeholder="用于第三方系统调用的密钥">
          <template #append>
            <el-button @click="regenerateKey">重新生成</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="回调 URL">
        <el-input v-model="form.callbackUrl" placeholder="https://example.com/callback" />
      </el-form-item>
      <el-form-item label="超时时间(s)">
        <el-input-number v-model="form.timeout" :min="5" :max="120" />
      </el-form-item>
      <el-form-item label="IP 白名单">
        <el-input v-model="form.ipWhitelist" type="textarea" :rows="3" placeholder="每行一个IP，留空不限制" />
      </el-form-item>
      <el-form-item label="启用状态">
        <el-switch v-model="form.enabled" active-text="启用" inactive-text="关闭" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const loading = ref(false);
const saving = ref(false);

const form = reactive({
  apiKey: '',
  callbackUrl: '',
  timeout: 30,
  ipWhitelist: '',
  enabled: true,
});

async function load() {
  loading.value = true;
  try {
    const { data } = await request.get('/system-configs', { params: { group: 'open_api' } });
    const configs: Record<string, any> = {};
    (data.rows ?? data.items ?? data ?? []).forEach((item: any) => {
      configs[item.key] = item.value;
    });
    form.apiKey = configs['open_api.api_key'] || '';
    form.callbackUrl = configs['open_api.callback_url'] || '';
    form.timeout = Number(configs['open_api.timeout']) || 30;
    form.ipWhitelist = configs['open_api.ip_whitelist'] || '';
    form.enabled = configs['open_api.enabled'] !== 'false';
  } finally {
    loading.value = false;
  }
}

function regenerateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  form.apiKey = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function handleSave() {
  saving.value = true;
  try {
    const items = [
      { key: 'open_api.api_key', value: form.apiKey },
      { key: 'open_api.callback_url', value: form.callbackUrl },
      { key: 'open_api.timeout', value: String(form.timeout) },
      { key: 'open_api.ip_whitelist', value: form.ipWhitelist },
      { key: 'open_api.enabled', value: String(form.enabled) },
    ];
    await request.put('/system-configs', { group: 'open_api', items });
    ElMessage.success('配置已保存');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
