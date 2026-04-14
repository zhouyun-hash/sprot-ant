<template>
  <el-card class="page-card">
    <template #header>
      <div class="toolbar">
        <span>打印模板</span>
      </div>
    </template>

    <el-row :gutter="16">
      <el-col v-for="tpl in templates" :key="tpl.id" :xs="24" :sm="12" :md="8" style="margin-bottom:16px">
        <el-card shadow="hover" class="tpl-card">
          <div class="tpl-preview">
            <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
          </div>
          <h4>{{ tpl.name }}</h4>
          <p class="tpl-desc">{{ tpl.description }}</p>
          <div class="tpl-footer">
            <el-button size="small" @click="openPreview(tpl)">预览</el-button>
            <el-button size="small" type="primary" @click="handleEdit(tpl)">编辑</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>

  <el-dialog v-model="previewVisible" :title="'预览 - ' + previewTpl.name" width="720px" destroy-on-close>
    <div class="preview-area">
      <div class="preview-placeholder">
        <el-icon :size="64" color="#dcdfe6"><Document /></el-icon>
        <p>{{ previewTpl.name }}</p>
        <p class="preview-hint">此处为模板预览区域，实际打印内容将根据数据动态渲染</p>
      </div>
      <div class="preview-fields">
        <h4>包含字段</h4>
        <el-tag v-for="f in previewTpl.fields" :key="f" size="small" style="margin:0 6px 6px 0">{{ f }}</el-tag>
      </div>
    </div>
    <template #footer>
      <el-button @click="previewVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Document } from '@element-plus/icons-vue';

const templates = reactive([
  {
    id: 1,
    name: '成绩单模板',
    description: '学生个人体测成绩报告，包含各项成绩、等级和总评',
    fields: ['姓名', '班级', '学号', '测试项目', '成绩', '等级', '总分', '综合评价'],
  },
  {
    id: 2,
    name: '体质报告模板',
    description: '学生体质健康综合报告，适用于学期末整体评估',
    fields: ['姓名', '班级', 'BMI', '肺活量', '各项成绩', '体质等级', '改进建议'],
  },
  {
    id: 3,
    name: '班级汇总模板',
    description: '班级体测数据汇总表，含合格率、优良率等统计',
    fields: ['班级', '总人数', '参测人数', '合格率', '优良率', '平均分', '各项分布'],
  },
]);

const previewVisible = ref(false);
const previewTpl = ref<any>({});

function openPreview(tpl: any) {
  previewTpl.value = tpl;
  previewVisible.value = true;
}

function handleEdit(tpl: any) {
  ElMessage.info(`编辑模板「${tpl.name}」功能开发中`);
}
</script>

<style scoped>
.tpl-card {
  text-align: center;
}
.tpl-preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
}
.tpl-card h4 {
  margin: 0 0 8px;
  font-size: 16px;
}
.tpl-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px;
  min-height: 36px;
}
.tpl-footer {
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}
.preview-area {
  text-align: center;
}
.preview-placeholder {
  padding: 40px 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}
.preview-placeholder p {
  margin: 8px 0 0;
  color: #606266;
}
.preview-hint {
  font-size: 13px;
  color: #909399;
}
.preview-fields {
  text-align: left;
}
.preview-fields h4 {
  margin: 0 0 10px;
  font-size: 14px;
}
</style>
