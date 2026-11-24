<template>
  <view class="page" :style="{ paddingTop: statusBar + 'px' }">
    <view class="hero">
      <view class="hero-bg">
        <view class="blob blob-mint" />
        <view class="blob blob-blue" />
        <view class="blob blob-coral" />
        <image class="hero-img" src="/static/illus/girl.png" mode="aspectFit" />
      </view>
      <view class="title">{{ store.title }}</view>
      <view class="subtitle">{{ store.name }} · {{ store.slogan }}</view>
      <view class="btn-black hero-btn" @click="go()">立即点单</view>
    </view>

    <view class="tiles">
      <view class="tile coral" @click="go('c_grain')">
        <image class="tile-img" src="/static/illus/noodle.png" mode="aspectFit" />
        <text class="tile-cn">速食泡面</text>
        <text class="tile-en">Instant Food</text>
      </view>
      <view class="tile mint" @click="go('c_daily')">
        <image class="tile-img" src="/static/illus/tissue.png" mode="aspectFit" />
        <text class="tile-cn">日用百货</text>
        <text class="tile-en">Daily Goods</text>
      </view>
      <view class="tile blue" @click="go('c_drink')">
        <image class="tile-img" src="/static/illus/water.png" mode="aspectFit" />
        <text class="tile-cn">饮用水</text>
        <text class="tile-en">Drinks</text>
      </view>
    </view>

    <view class="vip" @click="goVip">
      <view class="vip-circle c1" />
      <view class="vip-circle c2" />
      <view class="vip-top">
        <view class="vip-title">VIP</view>
        <view class="vip-level">{{ user ? user.vip.name : '普通会员' }}</view>
      </view>
      <view class="vip-meta">
        <view class="meta-item">
          <view class="meta-num">¥{{ money(user ? user.balance : 0) }}</view>
          <view class="meta-lab">余额</view>
        </view>
        <view class="meta-item">
          <view class="meta-num">{{ user ? user.points : 0 }}</view>
          <view class="meta-lab">积分</view>
        </view>
        <view class="vip-btn" @click.stop="goVip">点击充值</view>
      </view>
    </view>

    <view v-if="hot.length" class="hot">
      <view class="hot-head">
        <text class="section-title">本周热卖</text>
        <text class="more" @click="go()">全部商品 ›</text>
      </view>
      <scroll-view scroll-x class="hot-scroll" :show-scrollbar="false">
        <view class="hot-list">
          <view v-for="p in hot" :key="p.id" class="hot-item card" @click="go(p.categoryId)">
            <image class="hot-img" :src="imgUrl(p.image)" mode="aspectFit" />
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
import { userState, refreshUser, addToCart, syncBadge, menuState } from '../../store'

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

function go(category = '') {
  menuState.category = category
  uni.switchTab({ url: '/pages/menu/menu' })
}
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
  padding: 32rpx 0 44rpx;
}
.hero-bg {
  position: relative;
  width: 560rpx;
  height: 440rpx;
  display: flex;
  justify-content: center;
}
.blob {
  position: absolute;
  border-radius: 50%;
}
.blob-mint {
  width: 380rpx;
  height: 380rpx;
  left: 90rpx;
  top: 40rpx;
  background: $mint-light;
}
.blob-blue {
  width: 140rpx;
  height: 140rpx;
  right: 20rpx;
  top: 10rpx;
  background: $blue-light;
}
.blob-coral {
  width: 90rpx;
  height: 90rpx;
  left: 40rpx;
  bottom: 40rpx;
  background: $primary-light;
}
.hero-img {
  position: relative;
  width: 300rpx;
  height: 435rpx;
}
.title {
  margin-top: 20rpx;
  font-size: 68rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  line-height: 1.1;
  color: $ink;
}
.subtitle {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: $ink-2;
  letter-spacing: 2rpx;
}
.hero-btn {
  margin-top: 28rpx;
  width: 260rpx;
  box-shadow: 0 12rpx 28rpx rgba(255, 122, 89, 0.3);
}
.tiles {
  display: flex;
  gap: 20rpx;
}
.tile {
  flex: 1;
  border-radius: $radius;
  padding: 24rpx 0 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: $card;
  &.coral .tile-img {
    background: $primary-light;
  }
  &.mint .tile-img {
    background: $mint-light;
  }
  &.blue .tile-img {
    background: $blue-light;
  }
  &:active {
    transform: scale(0.97);
  }
}
.tile-img {
  width: 150rpx;
  height: 150rpx;
  padding: 18rpx;
  border-radius: 50%;
}
.tile-cn {
  margin-top: 14rpx;
  font-size: 30rpx;
  font-weight: 700;
}
.tile-en {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: $ink-3;
}
.vip {
  position: relative;
  overflow: hidden;
  margin-top: 24rpx;
  padding: 36rpx 40rpx;
  border-radius: $radius-lg;
  background: linear-gradient(120deg, #ff8a65 0%, #ff7a59 45%, #ffa26b 100%);
  color: #fff;
}
.vip-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  &.c1 {
    width: 260rpx;
    height: 260rpx;
    right: -60rpx;
    top: -80rpx;
  }
  &.c2 {
    width: 160rpx;
    height: 160rpx;
    right: 160rpx;
    bottom: -90rpx;
  }
}
.vip-top {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}
.vip-title {
  font-size: 80rpx;
  font-weight: 800;
  line-height: 1;
}
.vip-level {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.24);
}
.vip-meta {
  position: relative;
  margin-top: 28rpx;
  display: flex;
  align-items: flex-end;
  gap: 56rpx;
}
.meta-num {
  font-size: 36rpx;
  font-weight: 700;
}
.meta-lab {
  font-size: 22rpx;
  opacity: 0.85;
}
.vip-btn {
  margin-left: auto;
  height: 68rpx;
  line-height: 68rpx;
  padding: 0 32rpx;
  border-radius: 999rpx;
  background: #fff;
  color: $primary-dark;
  font-weight: 700;
  font-size: 26rpx;
}
.hot {
  margin-top: 36rpx;
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
  background: $card-2;
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
  background: $primary;
  color: #fff;
  text-align: center;
  line-height: 44rpx;
  font-size: 26rpx;
}
.foot-space {
  height: 40rpx;
}
</style>
