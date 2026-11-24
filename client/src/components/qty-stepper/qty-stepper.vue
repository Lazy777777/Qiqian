<template>
  <view class="stepper">
    <view v-if="value > 0" class="btn minus" @click.stop="$emit('change', -1)">－</view>
    <text v-if="value > 0" class="num">{{ value }}</text>
    <view class="btn plus" @click.stop="$emit('change', 1)">＋</view>
  </view>
</template>

<script setup>
defineProps({ value: { type: Number, default: 0 } })
defineEmits(['change'])
</script>

<style lang="scss" scoped>
.stepper {
  display: flex;
  align-items: center;
}
.btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 700;
}
.minus {
  border: 2rpx solid $primary;
  color: $ink;
}
.plus {
  background: $primary;
  color: #fff;
}
.num {
  min-width: 52rpx;
  text-align: center;
  font-weight: 600;
}
</style>
