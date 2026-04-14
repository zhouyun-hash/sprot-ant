<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>异常成绩审核</span>
        <el-button type="primary" @click="load">刷新</el-button>
      </div>
    </template>

    <el-tabs v-model="activeTab" @tab-change="load">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待审核" name="pending" />
      <el-tab-pane label="已通过" name="approved" />
      <el-tab-pane label="已驳回" name="rejected" />
    </el-tabs>

    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="scoreId" label="成绩ID" width="90" />
      <el-table-column prop="originalScore" label="原始成绩" width="100" />
      <el-table-column prop="correctedScore" label="修正成绩" width="100" />
      <el-table-column prop="reason" label="原因" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-space v-if="row.status === 'pending'">
            <el-button link type="success" @click="handleApprove(row)">通过</el-button>
            <el-button link type="danger" @click="handleReject(row)">驳回</el-button>
          </el-space>
          <span v-else class="text-muted">已处理</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        background
        layout="total, prev, pager, next"
        :total="total"
        @current-change="load"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const rows = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const activeTab = ref('all');
const query = reactive({ page: 1, pageSize: 20 });

function statusType(s: string) {
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'danger';
  return 'warning';
}

function statusLabel(s: string) {
  if (s === 'approved') return '已通过';
  if (s === 'rejected') return '已驳回';
  return '待审核';
}

async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: query.page, pageSize: query.pageSize };
    if (activeTab.value !== 'all') params.status = activeTab.value;
    const res = await request.get('/score-reviews', { params });
    rows.value = res.data?.items || [];
    total.value = Number(res.data?.total || 0);
  } finally {
    loading.value = false;
  }
}

async function handleApprove(row: any) {
  await ElMessageBox.confirm('确认通过该条异常成绩审核？', '确认操作', { type: 'warning' });
  await request.put(`/score-reviews/${row.id}/approve`);
  ElMessage.success('审核已通过');
  await load();
}

async function handleReject(row: any) {
  const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回审核', {
    confirmButtonText: '确认驳回',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '驳回原因不能为空',
  });
  await request.put(`/score-reviews/${row.id}/reject`, { rejectReason: value });
  ElMessage.success('已驳回');
  await load();
}

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.text-muted {
  color: #999;
  font-size: 13px;
}
</style>
