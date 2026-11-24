<template>
  <!-- #ifdef H5 -->
  <a class="call" :href="'tel:' + phone" @click.stop>
    <text class="icon">✆</text>
    <text>{{ text }}</text>
  </a>
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <view class="call" @click.stop="call">
    <text class="icon">✆</text>
    <text>{{ text }}</text>
  </view>
  <!-- #endif -->
</template>

<script setup>
const props = defineProps({
  phone: { type: String, required: true },
  text: { type: String, default: '拨打' }
})
function call() {
  uni.makePhoneCall({ phoneNumber: props.phone, fail() {} })
}
</script>

<style lang="scss" scoped>
.call {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  height: 60rpx;
  padding: 0 26rpx;
  border-radius: 999rpx;
  background: #2ec4a0;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  text-decoration: none;
  .icon {
    font-size: 28rpx;
  }
}
</style>
