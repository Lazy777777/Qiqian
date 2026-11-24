<template>
  <view class="page">
    <view class="head">
      <view>
        <view class="h-title">ORDERS</view>
        <view class="h-sub">{{ store.name }} · 商家后台</view>
      </view>
      <view class="h-actions">
        <view class="btn-black small light" @click="goProducts">商品</view>
        <view class="btn-black small light" @click="goSettings">设置</view>
        <view class="btn-black small ghost" @click="logout">退出</view>
      </view>
    </view>

    <view class="stats">
      <view :class="['stat', summary.newCount > 0 && 'alert']">
        <view class="num">{{ summary.newCount }}</view>
        <view class="lab">新订单</view>
      </view>
      <view class="stat">
        <view class="num">{{ summary.processing }}</view>
        <view class="lab">进行中</view>
      </view>
      <view class="stat">
        <view class="num">{{ summary.todayCount }}</view>
        <view class="lab">今日单量</view>
      </view>
      <view class="stat">
        <view class="num">¥{{ yuan(summary.todayAmount) }}</view>
        <view class="lab">今日营业额</view>
      </view>
    </view>

    <view class="tabs">
      <view v-for="t in tabs" :key="t.key" :class="['tab', active === t.key && 'on']" @click="switchTab(t.key)">
        {{ t.text }}<text v-if="t.key === 'pending' && summary.pending" class="cnt">{{ summary.pending }}</text>
      </view>
    </view>

    <view class="list">
      <view v-for="o in orders" :key="o.id" :class="['order card', !o.merchantSeen && 'fresh']" @click="open(o)">
        <view class="o-head">
          <view class="o-left">
            <text v-if="!o.merchantSeen" class="new">NEW</text>
            <text class="o-code">#{{ o.orderNo.slice(-4) }}</text>
          </view>
          <text class="o-status" :style="{ color: STATUS[o.status].color, background: STATUS[o.status].color + '1f' }">{{ o.statusText }}</text>
        </view>
        <view class="o-no">订单号 {{ o.orderNo }} · {{ shortTime(o.paidAt) }}</view>

        <view class="o-items">
          <text v-for="(i, k) in o.items" :key="k" class="o-item">{{ lineName(i) }} ×{{ i.qty }}</text>
        </view>
        <view v-if="o.remark" class="o-remark">备注：{{ o.remark }}</view>

        <view class="o-addr">
          <view class="o-addr-main">
            <view class="o-contact">{{ o.address.name }} <text class="o-phone">{{ o.address.phone }}</text></view>
            <view class="o-detail">{{ o.address.region }} {{ o.address.detail }}</view>
          </view>
          <call-button :phone="o.address.phone" />
        </view>

        <view class="o-foot">
          <text class="price">¥{{ money(o.payAmount) }}<text class="pm"> {{ o.payMethod === 'balance' ? '余额' : '微信' }}</text></text>
          <view class="o-btns">
            <view v-if="canRefund(o)" class="btn-black small ghost" @click.stop="refund(o)">退款</view>
            <view v-if="nextAction(o)" class="btn-black small" @click.stop="advance(o)">{{ nextAction(o).text }}</view>
          </view>
        </view>
      </view>

      <view v-if="loaded && !orders.length" class="empty"><text class="empty-text">暂无{{ tabText }}订单</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onHide, onUnload, onPullDownRefresh } from '@dcloudio/uni-app'
import { STORE } from '../../config'
import { api, getMerchantToken, setMerchantToken } from '../../utils/request'
import { money, yuan, shortTime, STATUS, lineName } from '../../utils/format'
import { nextAction, canRefund, updateStatus, refundOrder } from '../../utils/merchant'

const store = STORE
const tabs = [
  { key: 'pending', text: '待接单' },
  { key: 'processing', text: '进行中' },
  { key: 'completed', text: '已完成' },
  { key: 'refunded', text: '已退款' },
  { key: 'all', text: '全部' }
]
const active = ref('pending')
const orders = ref([])
const summary = ref({ newCount: 0, pending: 0, processing: 0, todayCount: 0, todayAmount: 0 })
const loaded = ref(false)
const tabText = computed(() => (active.value === 'all' ? '' : tabs.find((t) => t.key === active.value).text))
let timer = null
let lastNew = -1

async function load() {
  const [s, list] = await Promise.all([
    api.get('/api/merchant/summary', { merchant: true, silent: true }),
    api.get('/api/merchant/orders', { merchant: true, data: { status: active.value } })
  ])
  if (lastNew >= 0 && s.newCount > lastNew) {
    uni.vibrateLong({ fail() {} })
    uni.showToast({ title: `您有 ${s.newCount} 个新订单`, icon: 'none', duration: 2500 })
  }
  lastNew = s.newCount
  summary.value = s
  orders.value = list
  loaded.value = true
}

onShow(() => {
  if (!getMerchantToken()) return uni.redirectTo({ url: '/pages/merchant/login' })
  load()
  clearInterval(timer)
  timer = setInterval(() => load().catch(() => {}), 8000)
})
onHide(() => clearInterval(timer))
onUnload(() => clearInterval(timer))
onPullDownRefresh(() => load().finally(() => uni.stopPullDownRefresh()))

function switchTab(k) {
  active.value = k
  load()
}
const open = (o) => uni.navigateTo({ url: `/pages/merchant/order-detail?id=${o.id}` })
const goProducts = () => uni.navigateTo({ url: '/pages/merchant/products' })
const goSettings = () => uni.navigateTo({ url: '/pages/merchant/settings' })

async function advance(o) {
  const a = nextAction(o)
  await updateStatus(o.id, a.status)
  uni.showToast({ title: `已${a.text}`, icon: 'none' })
  load()
}
async function refund(o) {
  if (await refundOrder(o)) load()
}
function logout() {
  setMerchantToken('')
  uni.reLaunch({ url: '/pages/merchant/login' })
}
</script>

<style lang="scss" scoped>
.page {
  padding: 24rpx 28rpx 40rpx;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 4rpx 24rpx;
}
.h-title {
  font-size: 56rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  line-height: 1;
}
.h-sub {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $ink-2;
}
.h-actions {
  display: flex;
  gap: 12rpx;
}
.stats {
  display: flex;
  gap: 14rpx;
}
.stat {
  flex: 1;
  background: $card;
  border-radius: 24rpx;
  padding: 22rpx 8rpx;
  text-align: center;
  .num {
    font-size: 34rpx;
    font-weight: 800;
  }
  .lab {
    margin-top: 4rpx;
    font-size: 20rpx;
    color: $ink-2;
  }
  &.alert {
    background: $primary;
    color: #fff;
    .lab {
      color: #ffe1d6;
    }
  }
}
.tabs {
  display: flex;
  gap: 12rpx;
  margin: 28rpx 0 20rpx;
}
.tab {
  flex: 1;
  text-align: center;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 999rpx;
  background: $card-2;
  font-size: 24rpx;
  color: $ink-2;
  &.on {
    background: $primary;
    color: #fff;
    font-weight: 600;
  }
  .cnt {
    margin-left: 6rpx;
    color: $primary;
    font-weight: 800;
  }
  &.on .cnt {
    color: #fff;
  }
}
.order {
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 3rpx solid transparent;
  &.fresh {
    border-color: $primary;
    background: #fff4ef;
    box-shadow: 0 12rpx 36rpx rgba(255, 122, 89, 0.22);
  }
}
.o-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.o-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.new {
  background: $danger;
  color: #fff;
  font-size: 20rpx;
  font-weight: 800;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  letter-spacing: 2rpx;
}
.o-code {
  font-size: 40rpx;
  font-weight: 800;
}
.o-status {
  font-size: 24rpx;
  font-weight: 600;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
}
.o-no {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.o-items {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.o-item {
  font-size: 24rpx;
  background: $card-2;
  padding: 6rpx 14rpx;
  border-radius: 10rpx;
}
.o-remark {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $danger;
}
.o-addr {
  margin-top: 20rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.o-addr-main {
  flex: 1;
  min-width: 0;
}
.o-contact {
  font-weight: 700;
  font-size: 28rpx;
}
.o-phone {
  margin-left: 8rpx;
  font-weight: 600;
}
.o-detail {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: $ink-2;
}
.o-foot {
  margin-top: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .price {
    font-size: 36rpx;
  }
  .pm {
    margin-left: 8rpx;
    font-size: 22rpx;
    font-weight: 400;
    color: $ink-3;
  }
}
.o-btns {
  display: flex;
  gap: 12rpx;
}
</style>
