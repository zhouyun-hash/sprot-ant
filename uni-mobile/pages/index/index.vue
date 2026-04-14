<template>
  <view class="wrap">
    <text class="h1">蚁数智动智慧体育</text>
    <text class="sub">请选择端（开发调试用）</text>
    <button class="btn" @click="go('/packageTeacher/pages/t01')">教师端</button>
    <button class="btn" @click="go('/packageStudent/pages/s01')">学生端</button>
    <button class="btn" @click="go('/packageParent/pages/p01')">家长端</button>
  </view>
</template>

<script setup lang="ts">
function go(url: string) {
  uni.navigateTo({ url });
}
</script>

<style scoped>
.wrap {
  padding: 48rpx;
}
.h1 {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}
.sub {
  color: #666;
  font-size: 26rpx;
  display: block;
  margin-bottom: 48rpx;
}
.btn {
  margin-bottom: 24rpx;
  background: #1e88e5;
  color: #fff;
}
</style>
