/**
 * 根据页面标题数组生成占位 .vue 与 pages.json 片段（开发前执行：node scripts/gen-pages.cjs）
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const teacher = [
  '登录', '首页', '我的班级', '课堂教学', '发起测试', '实时成绩', '投屏排行榜', '体测记录', '成绩查看',
  '异常提醒', '班级报告', '学生档案', '体质分析', '运动处方', '布置作业', '作业查看', 'AI批改',
  '家校沟通', '消息通知', '运动安全预警', '个人中心', '修改密码', '帮助手册', '数据导出', '班级排名',
  '项目分析', '训练计划', '课堂小结', '学生打卡', '成绩对比', '视频回放', '设置',
];
const student = [
  '登录人脸核验', '首页', '自主训练', '跳绳训练', '立定跳远', '仰卧起坐', '跑步测试', '实时计数',
  '动作提示', '成绩记录', '我的成绩', '体测查看', '体质报告', '弱项分析', '训练建议', '运动排行榜',
  '勋章中心', '打卡日历', '班级PK', '运动安全提醒', '个人信息', '历史记录', '消息通知', '设置',
];
const parent = [
  '登录绑定', '孩子数据总览', '体测成绩', '体质评分', '运动趋势', '每日运动', '作业完成情况',
  '家庭训练建议', '月度报告', '学期报告', '消息通知', '班级动态', '安全提醒', '孩子档案',
  '绑定管理', '帮助', '设置', '健康建议',
];

function writeVue(dir, name, title) {
  const file = path.join(root, dir, `${name}.vue`);
  const content = `<template>
  <view class="p">
    <text class="t">${title}</text>
    <text class="s">占位页，对接 /api/app/**</text>
  </view>
</template>
<script setup lang="ts"></script>
<style scoped>
.p { padding: 24rpx; }
.t { font-size: 36rpx; font-weight: bold; display: block; margin-bottom: 16rpx; }
.s { color: #888; font-size: 26rpx; }
</style>
`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

teacher.forEach((t, i) => writeVue('packageTeacher/pages', `t${String(i + 1).padStart(2, '0')}`, t));
student.forEach((t, i) => writeVue('packageStudent/pages', `s${String(i + 1).padStart(2, '0')}`, t));
parent.forEach((t, i) => writeVue('packageParent/pages', `p${String(i + 1).padStart(2, '0')}`, t));

const pages = [
  { path: 'pages/index/index', style: { navigationBarTitleText: '角色入口' } },
];
const subPackages = [
  {
    root: 'packageTeacher',
    pages: teacher.map((_, i) => ({
      path: `pages/t${String(i + 1).padStart(2, '0')}`,
      style: { navigationBarTitleText: teacher[i] },
    })),
  },
  {
    root: 'packageStudent',
    pages: student.map((_, i) => ({
      path: `pages/s${String(i + 1).padStart(2, '0')}`,
      style: { navigationBarTitleText: student[i] },
    })),
  },
  {
    root: 'packageParent',
    pages: parent.map((_, i) => ({
      path: `pages/p${String(i + 1).padStart(2, '0')}`,
      style: { navigationBarTitleText: parent[i] },
    })),
  },
];

const pagesJson = {
  pages,
  subPackages,
  globalStyle: {
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '蚁数智动',
    navigationBarBackgroundColor: '#FFFFFF',
  },
};

fs.writeFileSync(path.join(root, 'pages.json'), JSON.stringify(pagesJson, null, 2), 'utf8');
console.log('Generated teacher', teacher.length, 'student', student.length, 'parent', parent.length);
