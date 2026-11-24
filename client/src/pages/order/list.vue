<template>
  <view class="page">
    <scroll-view scroll-x class="tabs" :show-scrollbar="false">
      <view class="tabs-inner">
        <view v-for="t in tabs" :key="t.key" :class="['tab', active === t.key && 'on']" @click="switchTab(t.key)">{{ t.text }}</view>
      </view>
    </scroll-view>

    <view class="list">
      <view v-for="o in orders" :key="o.id" class="order card" @click="open(o)">
        <view class="o-head">
          <view>
            <view class="o-type">订单号 {{ o.orderNo }}</view>
            <view class="o-no">{{ o.items.map((i) => i.name).join('、') }}</view>
          </view>
          <text class="o-status" :style="{ color: STATUS[o.status].color, background: STATUS[o.status].color + '1f' }">{{ o.statusText }}</text>
        </view>
        <view class="o-goods">
          <image v-for="i in o.items.slice(0, 4)" :key="i.productId" class="o-img" :src="imgUrl(i.image)" mode="aspectFit" />
          <view class="o-count">
            <text class="muted">共 {{ o.items.reduce((s, i) => s + i.qty, 0) }} 件</text>
            <text class="price">¥{{ money(o.payAmount) }}</text>
          </view>
        </view>
        <view class="o-foot">
          <text class="muted">{{ shortTime(o.createdAt) }}</text>
          <view v-if="o.status === 'unpaid'" class="btn-black small">去支付</view>
          <view v-else class="btn-black small ghost">查看详情</view>
        </view>
      </view>

      <view v-if="loaded && !orders.length" class="empty">
        <image class="empty-img" src="/static/illus/noodle.png" mode="aspectFit" />
        <text class="empty-text">暂无订单</text>
        <view class="btn-black" style="width: 300rpx; margin: 0 auto" @click="goMenu">去逛逛</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onHide } from '@dcloudio/uni-app'
import { api, imgUrl } from '../../utils/request'
import { money, shortTime, STATUS } from '../../utils/format'
import { ensureLogin, syncBadge } from '../../store'

const tabs = [
  { key: 'all', text: '全部' },
  { key: 'unpaid', text: '待付款' },
  { key: 'pending', text: '待接单' },
  { key: 'preparing', text: '备货中' },
  { key: 'delivering', text: '配送中' },
  { key: 'completed', text: '已完成' },
  { key: 'refunded', text: '已退款' }
]
const active = ref('all')
const orders = ref([])
const loaded = ref(false)
let timer = null

async function load() {
  await ensureLogin()
  orders.value = await api.get('/api/orders', { data: { status: active.value } })
  loaded.value = true
}
function switchTab(k) {
  active.value = k
  load()
}
onShow(() => {
  syncBadge()
  load()
  clearInterval(timer)
  timer = setInterval(() => load().catch(() => {}), 15000)
})
onHide(() => clearInterval(timer))
onPullDownRefresh(() => load().finally(() => uni.stopPullDownRefresh()))

const open = (o) => uni.navigateTo({ url: `/pages/order/detail?id=${o.id}` })
const goMenu = () => uni.switchTab({ url: '/pages/menu/menu' })
</script>

<style lang="scss" scoped>
.page {
  padding-bottom: 30rpx;
}
.tabs {
  white-space: nowrap;
  padding: 16rpx 0 8rpx;
}
.tabs-inner {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 28rpx;
}
.tab {
  padding: 0 28rpx;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 999rpx;
  background: $card-2;
  font-size: 26rpx;
  color: $ink-2;
  &.on {
    background: $primary;
    color: #fff;
    font-weight: 600;
  }
}
.list {
  padding: 12rpx 28rpx;
}
.order {
  padding: 28rpx;
  margin-bottom: 20rpx;
}
.o-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.o-head > view:first-child {
  flex: 1;
  min-width: 0;
  margin-right: 16rpx;
}
.o-type {
  font-size: 28rpx;
  font-weight: 700;
}
.o-no {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $ink-3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.o-status {
  font-size: 24rpx;
  font-weight: 600;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
}
.o-goods {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin: 24rpx 0;
}
.o-img {
  width: 104rpx;
  height: 104rpx;
  border-radius: 18rpx;
}
.o-count {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 22rpx;
  .price {
    font-size: 34rpx;
    margin-top: 4rpx;
  }
}
.o-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
}
</style>
