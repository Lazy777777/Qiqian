<template>
  <view class="page" :style="{ paddingTop: statusBar + 'px' }">
    <view class="hero">
      <image class="hero-img" src="/static/illus/hero.svg" mode="aspectFit" />
      <view class="title">{{ store.title }}</view>
      <view class="subtitle">{{ store.name }} · {{ store.slogan }}</view>
    </view>

    <view class="tiles">
      <view class="tile" @click="go('delivery')">
        <image class="tile-img" src="/static/illus/tile-delivery.svg" mode="aspectFit" />
        <text class="tile-cn">外卖配送</text>
        <text class="tile-en">Delivery</text>
      </view>
      <view class="tile" @click="go('pickup')">
        <image class="tile-img" src="/static/illus/tile-pickup.svg" mode="aspectFit" />
        <text class="tile-cn">到店自提</text>
        <text class="tile-en">Pick Up</text>
      </view>
      <view class="tile" @click="goOrders">
        <image class="tile-img" src="/static/illus/tile-order.svg" mode="aspectFit" />
        <text class="tile-cn">订单</text>
        <text class="tile-en">My Order</text>
      </view>
    </view>

    <view class="vip card" @click="goVip">
      <view class="vip-left">
        <view class="vip-title">VIP</view>
        <view class="vip-meta">
          <text>¥{{ money(user ? user.balance : 0) }}</text>
          <text class="sep">|</text>
          <text>积分 {{ user ? user.points : 0 }}</text>
          <text class="sep">|</text>
          <text>{{ user ? user.vip.name : '普通会员' }}</text>
        </view>
        <view class="btn-black vip-btn" @click.stop="goVip">点击充值</view>
      </view>
      <image class="vip-img" src="/static/illus/vip-character.svg" mode="aspectFit" />
    </view>

    <view v-if="hot.length" class="hot">
      <view class="hot-head">
        <text class="section-title">本周热卖</text>
        <text class="more" @click="go(cart.deliveryType)">全部商品 ›</text>
      </view>
      <scroll-view scroll-x class="hot-scroll" :show-scrollbar="false">
        <view class="hot-list">
          <view v-for="p in hot" :key="p.id" class="hot-item card" @click="go(cart.deliveryType)">
            <image class="hot-img" :src="imgUrl(p.image)" mode="aspectFill" />
            <view class="hot-name">{{ p.name }}</view>
            <view class="hot-foot">
              <text class="price"><text class="sym">¥</text>{{ yuan(p.price) }}</text>
              <view class="hot-add" @click.stop="add(p)">＋</view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
    <view class="foot-space" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { STORE } from '../../config'
import { api, imgUrl } from '../../utils/request'
import { money, yuan } from '../../utils/format'
import { userState, refreshUser, cart, addToCart, syncBadge } from '../../store'

const store = STORE
const statusBar = ref(0)
// #ifdef MP-WEIXIN
statusBar.value = uni.getSystemInfoSync().statusBarHeight || 20
// #endif

const user = computed(() => userState.user)
const products = ref([])
const hot = computed(() => [...products.value].sort((a, b) => b.sales - a.sales).slice(0, 6))

onShow(() => {
  syncBadge()
  refreshUser().catch(() => {})
  api.get('/api/menu', { silent: true }).then((d) => (products.value = d.products)).catch(() => {})
})

function go(type) {
  cart.deliveryType = type
  uni.switchTab({ url: '/pages/menu/menu' })
}
const goOrders = () => uni.switchTab({ url: '/pages/order/list' })
const goVip = () => uni.navigateTo({ url: '/pages/vip/vip' })
function add(p) {
  addToCart(p, 1)
  uni.showToast({ title: '已加入购物车', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding-left: 32rpx;
  padding-right: 32rpx;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0 56rpx;
}
.hero-img {
  width: 500rpx;
  height: 400rpx;
}
.title {
  margin-top: 12rpx;
  font-size: 68rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  line-height: 1.1;
  color: $ink;
}
.subtitle {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: $ink-2;
  letter-spacing: 2rpx;
}
.tiles {
  display: flex;
  gap: 22rpx;
}
.tile {
  flex: 1;
  background: $card;
  border-radius: $radius;
  padding: 28rpx 0 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  &:active {
    transform: scale(0.97);
  }
}
.tile-img {
  width: 150rpx;
  height: 150rpx;
}
.tile-cn {
  margin-top: 14rpx;
  font-size: 34rpx;
  font-weight: 700;
}
.tile-en {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: $ink-2;
}
.vip {
  margin-top: 24rpx;
  padding: 44rpx 24rpx 40rpx 56rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.vip-title {
  font-size: 96rpx;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 2rpx;
}
.vip-meta {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: $ink-2;
  .sep {
    margin: 0 14rpx;
  }
}
.vip-btn {
  margin-top: 56rpx;
  width: 230rpx;
}
.vip-img {
  width: 230rpx;
  height: 260rpx;
}
.hot {
  margin-top: 40rpx;
}
.hot-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  .more {
    font-size: 24rpx;
    color: $ink-2;
  }
}
.hot-scroll {
  white-space: nowrap;
}
.hot-list {
  display: inline-flex;
  gap: 20rpx;
}
.hot-item {
  width: 230rpx;
  padding: 16rpx;
  border-radius: $radius;
}
.hot-img {
  width: 198rpx;
  height: 198rpx;
  border-radius: 20rpx;
}
.hot-name {
  margin-top: 10rpx;
  font-size: 26rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hot-foot {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hot-add {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: $ink;
  color: #fff;
  text-align: center;
  line-height: 44rpx;
  font-size: 26rpx;
}
.foot-space {
  height: 40rpx;
}
</style>
