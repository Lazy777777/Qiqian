<template>
  <view class="page">
    <template v-if="cart.items.length">
      <view class="head">
        <view>
          <view class="h-title">购物袋</view>
          <view class="h-sub">共 {{ cartCount }} 件商品 · {{ cart.deliveryType === 'pickup' ? '到店自提' : '外卖配送' }}</view>
        </view>
        <text class="h-action" @click="editing = !editing">{{ editing ? '完成' : '管理' }}</text>
      </view>

      <view class="list card">
        <view v-for="i in cart.items" :key="i.productId" class="row">
          <view :class="['check', i.checked && 'on']" @click="toggleChecked(i.productId)">
            <text v-if="i.checked">✓</text>
          </view>
          <image class="img" :src="imgUrl(i.image)" mode="aspectFill" />
          <view class="info">
            <view class="name">{{ i.name }}</view>
            <view class="desc">{{ i.desc }}</view>
            <view class="foot">
              <text class="price"><text class="sym">¥</text>{{ yuan(i.price) }}</text>
              <qty-stepper :value="i.qty" @change="(d) => setQty(i.productId, i.qty + d)" />
            </view>
          </view>
        </view>
      </view>

      <view class="tip card">
        <text class="tip-label">配送说明</text>
        <text class="tip-text">{{ tip }}</text>
      </view>
      <view style="height: 200rpx" />

      <view class="bar">
        <view class="all" @click="toggleAll(!allChecked)">
          <view :class="['check', allChecked && 'on']"><text v-if="allChecked">✓</text></view>
          <text>全选</text>
        </view>
        <view v-if="!editing" class="sum">
          <text class="muted">合计 </text>
          <text class="price big"><text class="sym">¥</text>{{ money(cartTotal) }}</text>
        </view>
        <view v-if="editing" class="btn-black danger" @click="remove">删除所选</view>
        <view v-else :class="['btn-black', !checkedItems.length && 'disabled']" @click="checkout">去结算</view>
      </view>
    </template>

    <view v-else class="empty">
      <image class="empty-img" src="/static/illus/tile-pickup.svg" mode="aspectFit" />
      <text class="empty-text">购物袋空空如也，去挑点好物吧</text>
      <view class="btn-black" style="width: 300rpx; margin: 0 auto" @click="goMenu">去选购</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { imgUrl } from '../../utils/request'
import { yuan, money } from '../../utils/format'
import {
  cart, cartCount, cartTotal, checkedItems, setQty, toggleChecked, toggleAll, removeChecked,
  syncBadge, userState, loadConfig, ensureLogin
} from '../../store'

const editing = ref(false)
const allChecked = computed(() => cart.items.length > 0 && cart.items.every((i) => i.checked))
const tip = computed(() => {
  if (cart.deliveryType === 'pickup') return '到店自提免配送费，凭订单号到店取货'
  const cfg = userState.config
  if (!cfg) return '外卖配送，最快 30 分钟送达'
  return `配送费 ¥${yuan(cfg.deliveryFee)}，满 ¥${yuan(cfg.freeDeliveryThreshold)} 免配送费；银卡及以上会员免配送费`
})

onShow(() => {
  syncBadge()
  loadConfig().catch(() => {})
})

function remove() {
  if (!checkedItems.value.length) return
  uni.showModal({
    title: '提示',
    content: `确定删除选中的 ${checkedItems.value.length} 件商品？`,
    success: (r) => {
      if (r.confirm) {
        removeChecked()
        editing.value = false
      }
    }
  })
}
async function checkout() {
  if (!checkedItems.value.length) return uni.showToast({ title: '请选择商品', icon: 'none' })
  await ensureLogin()
  uni.navigateTo({ url: '/pages/checkout/checkout' })
}
const goMenu = () => uni.switchTab({ url: '/pages/menu/menu' })
</script>

<style lang="scss" scoped>
.page {
  padding: 24rpx 28rpx;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 8rpx 8rpx 24rpx;
}
.h-title {
  font-size: 48rpx;
  font-weight: 800;
}
.h-sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: $ink-2;
}
.h-action {
  font-size: 26rpx;
  padding: 8rpx 0;
}
.list {
  padding: 8rpx 24rpx;
}
.row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  & + .row {
    border-top: 1rpx solid #e6dfd2;
  }
}
.check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #b9b1a6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  flex-shrink: 0;
  &.on {
    background: $ink;
    border-color: $ink;
    color: #fff;
  }
}
.img {
  width: 150rpx;
  height: 150rpx;
  border-radius: 20rpx;
  margin-left: 20rpx;
  flex-shrink: 0;
}
.info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  height: 150rpx;
  display: flex;
  flex-direction: column;
}
.name {
  font-size: 28rpx;
  font-weight: 700;
}
.desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.foot {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .price {
    font-size: 32rpx;
  }
}
.tip {
  margin-top: 20rpx;
  padding: 24rpx;
  display: flex;
  gap: 16rpx;
  font-size: 24rpx;
  .tip-label {
    font-weight: 700;
    flex-shrink: 0;
  }
  .tip-text {
    color: $ink-2;
  }
}
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--window-bottom, 0px);
  height: 120rpx;
  background: $card;
  display: flex;
  align-items: center;
  padding: 0 28rpx;
  gap: 20rpx;
  border-radius: 36rpx 36rpx 0 0;
  box-shadow: 0 -8rpx 30rpx rgba(20, 18, 16, 0.06);
}
.all {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
}
.sum {
  flex: 1;
  text-align: right;
  font-size: 24rpx;
  .big {
    font-size: 40rpx;
  }
}
.bar .btn-black {
  margin-left: auto;
}
.sum + .btn-black {
  margin-left: 0;
}
</style>
