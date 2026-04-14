<template>
  <view class="p">
    <text class="t">教师端</text>
    <text v-if="displayName" class="welcome">你好，{{ displayName }}</text>
    <text class="s">更多功能对接中，可从「我的」等子页进入。</text>
    <button class="out" @click="onLogout">退出登录</button>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUser, clearAuth } from '../../utils/api'

const displayName = ref('')

function refresh() {
  const u = getUser()
  displayName.value = (u?.name as string) || (u?.username as string) || ''
}

onShow(() => {
  refresh()
})

function onLogout() {
  clearAuth()
  uni.reLaunch({ url: '/packageTeacher/pages/t01' })
}
</script>
<style scoped>
.p {
  padding: 48rpx 32rpx;
}
.t {
  font-size: 40rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}
.welcome {
  display: block;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 24rpx;
}
.s {
  color: #888;
  font-size: 26rpx;
  line-height: 1.5;
  display: block;
  margin-bottom: 48rpx;
}
.out {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #1677ff;
  background: transparent;
  border: 1px solid #1677ff;
  border-radius: 12rpx;
}
</style>
