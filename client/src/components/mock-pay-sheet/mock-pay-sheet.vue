<template>
  <view v-if="show" class="mask" @click="cancel" @touchmove.stop.prevent>
    <view class="sheet safe-bottom" @click.stop>
      <view class="head">
        <text class="close" @click="cancel">✕</text>
        <text class="title">微信支付</text>
        <text class="badge">模拟</text>
      </view>
      <view class="store">{{ storeName }}</view>
      <view class="desc">{{ description }}</view>
      <view class="amount"><text class="sym">¥</text>{{ money(amount) }}</view>
      <view class="row">
        <text class="muted">付款方式</text>
        <text>零钱（模拟）</text>
      </view>
      <button class="pay-btn" :loading="loading" :disabled="loading" @click="$emit('confirm')">确认支付</button>
      <view class="tip">演示环境：不会产生真实扣款。接入商户号后将调起真实微信支付。</view>
    </view>
  </view>
</template>

<script setup>
import { STORE } from '../../config'
import { money } from '../../utils/format'

defineProps({
  show: Boolean,
  amount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  loading: Boolean
})
const emit = defineEmits(['confirm', 'cancel'])
const storeName = STORE.name
const cancel = () => emit('cancel')
</script>

<style lang="scss" scoped>
.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: rgba(31, 42, 55, 0.45);
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 36rpx 36rpx 0 0;
  padding: 32rpx 40rpx 40rpx;
}
.head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  .close {
    position: absolute;
    left: 0;
    font-size: 34rpx;
    color: #888;
    padding: 8rpx;
  }
  .title {
    font-size: 30rpx;
    font-weight: 600;
  }
  .badge {
    font-size: 20rpx;
    color: #07c160;
    border: 1rpx solid #07c160;
    border-radius: 8rpx;
    padding: 0 8rpx;
  }
}
.store {
  margin-top: 44rpx;
  text-align: center;
  font-size: 28rpx;
}
.desc {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}
.amount {
  text-align: center;
  font-size: 76rpx;
  font-weight: 700;
  margin: 24rpx 0 36rpx;
  .sym {
    font-size: 44rpx;
    margin-right: 6rpx;
  }
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 0;
  border-top: 1rpx solid #eee;
  font-size: 26rpx;
}
.pay-btn {
  margin-top: 28rpx;
  background: #07c160;
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
  height: 92rpx;
  line-height: 92rpx;
}
.tip {
  margin-top: 20rpx;
  text-align: center;
  font-size: 22rpx;
  color: #aaa;
}
</style>
