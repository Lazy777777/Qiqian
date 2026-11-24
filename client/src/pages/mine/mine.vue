<template>
  <view class="page" :style="{ paddingTop: statusBar + 'px' }">
    <view class="profile">
      <view class="avatar">{{ (user && user.nickname.slice(-3)) || '会员' }}</view>
      <view>
        <view class="nick">{{ user ? user.nickname : '加载中…' }}</view>
        <view class="level">{{ user ? user.vip.name : '' }}<text v-if="user && user.nextVip"> · 再充 ¥{{ yuan(user.nextVip.need) }} 升级{{ user.nextVip.name }}</text></view>
      </view>
    </view>

    <view class="vipcard" @click="go('/pages/vip/vip')">
      <view class="vc-top">
        <text class="vc-title">VIP</text>
        <text class="vc-level">{{ user ? user.vip.name : '' }}</text>
      </view>
      <view class="vc-stats">
        <view class="stat">
          <view class="num">¥{{ money(user ? user.balance : 0) }}</view>
          <view class="lab">余额</view>
        </view>
        <view class="stat">
          <view class="num">{{ user ? user.points : 0 }}</view>
          <view class="lab">积分</view>
        </view>
        <view class="btn-black small vc-btn" @click.stop="go('/pages/vip/vip')">充值</view>
      </view>
    </view>

    <view class="menu card">
      <view class="m-row" @click="goOrders"><text>我的订单</text><text class="arrow">›</text></view>
      <view class="m-row" @click="go('/pages/address/list')"><text>收货地址</text><text class="arrow">›</text></view>
      <view class="m-row" @click="go('/pages/vip/vip')"><text>会员卡与余额明细</text><text class="arrow">›</text></view>
      <view class="m-row" @click="call"><text>联系商家</text><text class="muted">{{ store.phone }} ›</text></view>
    </view>

    <view class="menu card">
      <view class="m-row" @click="go('/pages/merchant/login')"><text>商家入口</text><text class="muted">店主登录 ›</text></view>
    </view>
    <view class="ver">{{ store.name }} · v1.0.0</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { STORE } from '../../config'
import { money, yuan } from '../../utils/format'
import { userState, refreshUser, syncBadge } from '../../store'

const store = STORE
const statusBar = ref(0)
// #ifdef MP-WEIXIN
statusBar.value = uni.getSystemInfoSync().statusBarHeight || 20
// #endif
const user = computed(() => userState.user)

onShow(() => {
  syncBadge()
  refreshUser().catch(() => {})
})
const go = (url) => uni.navigateTo({ url })
const goOrders = () => uni.switchTab({ url: '/pages/order/list' })
const call = () => uni.makePhoneCall({ phoneNumber: STORE.phone, fail() {} })
</script>

<style lang="scss" scoped>
.page {
  padding-left: 28rpx;
  padding-right: 28rpx;
}
.profile {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 48rpx 8rpx 36rpx;
}
.avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: $primary;
  color: $card;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 28rpx;
}
.nick {
  font-size: 40rpx;
  font-weight: 800;
}
.level {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: $ink-2;
}
.vipcard {
  background: linear-gradient(120deg, #ff8a65 0%, #ff7a59 45%, #ffa26b 100%);
  color: $card;
  border-radius: $radius-lg;
  padding: 36rpx 40rpx;
}
.vc-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.vc-title {
  font-size: 72rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
}
.vc-level {
  font-size: 24rpx;
  color: #fff;
}
.vc-stats {
  margin-top: 28rpx;
  display: flex;
  align-items: flex-end;
  gap: 60rpx;
}
.stat .num {
  font-size: 40rpx;
  font-weight: 700;
}
.stat .lab {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
}
.vc-btn {
  margin-left: auto;
  background: #fff;
  color: $primary-dark;
}
.menu {
  margin-top: 24rpx;
  padding: 0 32rpx;
}
.m-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 104rpx;
  font-size: 28rpx;
  & + .m-row {
    border-top: 1rpx solid #edf1f3;
  }
  .arrow {
    color: $ink-3;
    font-size: 36rpx;
  }
}
.ver {
  text-align: center;
  font-size: 22rpx;
  color: $ink-3;
  padding: 40rpx 0;
}
</style>
