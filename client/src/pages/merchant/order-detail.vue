<template>
  <view v-if="order" class="page">
    <view class="status card">
      <view class="row">
        <view>
          <view class="code">#{{ order.orderNo.slice(-4) }}</view>
          <view class="no">订单号 {{ order.orderNo }}</view>
        </view>
        <text class="st" :style="{ color: STATUS[order.status].color, background: STATUS[order.status].color + '1f' }">{{ order.statusText }}</text>
      </view>
      <view v-if="order.status !== 'refunded'" class="steps">
        <view
          v-for="s in statusOptions"
          :key="s.key"
          :class="['step', order.status === s.key && 'on']"
          @click="changeStatus(s.key)"
        >{{ s.text }}</view>
      </view>
      <view v-else class="refund-note">已退款 ¥{{ money(order.payAmount) }} 至用户余额：{{ order.refundReason }}</view>
    </view>

    <view class="card block">
      <view class="block-title">{{ order.deliveryType === 'pickup' ? '自提联系人' : '收货信息' }}</view>
      <view class="contact">
        <view class="c-main">
          <view class="c-name">{{ order.address.name }}</view>
          <view class="c-phone">{{ order.address.phone }}</view>
        </view>
        <call-button :phone="order.address.phone" text="一键拨打" />
      </view>
      <view class="addr">{{ order.address.region }} {{ order.address.detail }}</view>
      <view class="muted small">下单用户：{{ order.userNickname }}</view>
    </view>

    <view class="card block">
      <view class="block-title">商品（{{ order.items.reduce((s, i) => s + i.qty, 0) }} 件）</view>
      <view v-for="i in order.items" :key="i.productId" class="g-row">
        <image class="g-img" :src="imgUrl(i.image)" mode="aspectFill" />
        <view class="g-name">{{ i.name }}</view>
        <text class="g-qty">×{{ i.qty }}</text>
        <text class="g-price">¥{{ money(i.price * i.qty) }}</text>
      </view>
      <view class="fee"><text class="muted">商品金额</text><text>¥{{ money(order.goodsAmount) }}</text></view>
      <view v-if="order.discount" class="fee"><text class="muted">会员折扣</text><text>-¥{{ money(order.discount) }}</text></view>
      <view class="fee"><text class="muted">配送费</text><text>¥{{ money(order.deliveryFee) }}</text></view>
      <view class="fee total"><text>实收</text><text class="price">¥{{ money(order.payAmount) }}</text></view>
    </view>

    <view class="card block">
      <view class="kv"><text class="muted">下单时间</text><text>{{ dateTime(order.createdAt) }}</text></view>
      <view class="kv"><text class="muted">支付时间</text><text>{{ dateTime(order.paidAt) }}</text></view>
      <view class="kv"><text class="muted">支付方式</text><text>{{ order.payMethod === 'balance' ? '会员余额' : '微信支付（模拟）' }}</text></view>
      <view class="kv"><text class="muted">备注</text><text>{{ order.remark || '无' }}</text></view>
    </view>

    <view style="height: 160rpx" />
    <view v-if="canRefund(order) || nextAction(order)" class="bar safe-bottom">
      <view v-if="canRefund(order)" class="btn-black ghost" @click="refund">退款</view>
      <view v-if="nextAction(order)" class="btn-black" @click="changeStatus(nextAction(order).status)">{{ nextAction(order).text }}</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api, imgUrl } from '../../utils/request'
import { money, dateTime, STATUS } from '../../utils/format'
import { nextAction, canRefund, updateStatus, refundOrder } from '../../utils/merchant'

const order = ref(null)
let id = ''
const statusOptions = computed(() => [
  { key: 'pending', text: '待接单' },
  { key: 'preparing', text: '备货中' },
  { key: 'delivering', text: order.value.deliveryType === 'pickup' ? '待取货' : '配送中' },
  { key: 'completed', text: '已完成' }
])

onLoad((q) => (id = q.id))
onShow(load)
async function load() {
  order.value = await api.get(`/api/merchant/orders/${id}`, { merchant: true })
}
async function changeStatus(status) {
  if (status === order.value.status) return
  order.value = await updateStatus(id, status)
  uni.showToast({ title: '状态已更新', icon: 'none' })
}
async function refund() {
  const o = await refundOrder(order.value)
  if (o) order.value = o
}
</script>

<style lang="scss" scoped>
.page {
  padding: 20rpx 28rpx;
}
.card {
  padding: 28rpx;
  margin-bottom: 20rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.code {
  font-size: 64rpx;
  font-weight: 800;
  line-height: 1;
}
.no {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.st {
  font-size: 26rpx;
  font-weight: 700;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
}
.steps {
  margin-top: 28rpx;
  display: flex;
  gap: 12rpx;
}
.step {
  flex: 1;
  text-align: center;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  background: $card-2;
  color: $ink-2;
  &.on {
    background: $ink;
    color: #fff;
    font-weight: 700;
  }
}
.refund-note {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: $ink-2;
}
.block-title {
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}
.contact {
  display: flex;
  align-items: center;
}
.c-main {
  flex: 1;
}
.c-name {
  font-size: 32rpx;
  font-weight: 700;
}
.c-phone {
  margin-top: 4rpx;
  font-size: 30rpx;
  letter-spacing: 1rpx;
}
.addr {
  margin: 18rpx 0 10rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.small {
  font-size: 22rpx;
}
.g-row {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
  font-size: 26rpx;
}
.g-img {
  width: 80rpx;
  height: 80rpx;
  border-radius: 14rpx;
}
.g-name {
  flex: 1;
  margin: 0 16rpx;
}
.g-qty {
  width: 70rpx;
  font-weight: 700;
}
.g-price {
  width: 130rpx;
  text-align: right;
}
.fee {
  display: flex;
  justify-content: space-between;
  padding-top: 14rpx;
  font-size: 26rpx;
  &.total {
    border-top: 1rpx dashed #d5cdbf;
    margin-top: 12rpx;
    padding-top: 18rpx;
    font-weight: 700;
    .price {
      font-size: 34rpx;
    }
  }
}
.kv {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  font-size: 26rpx;
}
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  padding: 20rpx 28rpx;
  background: $card;
  border-radius: 36rpx 36rpx 0 0;
}
</style>
