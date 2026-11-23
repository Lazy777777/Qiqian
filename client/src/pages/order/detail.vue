<template>
  <view v-if="order" class="page">
    <view class="status card">
      <view v-if="justPaid" class="paid-badge">✓ 支付成功</view>
      <view class="st-text" :style="{ color: st.color }">{{ st.text }}</view>
      <view class="st-desc">{{ st.desc }}</view>
      <view v-if="steps.length" class="steps">
        <view v-for="(s, idx) in steps" :key="s.key" :class="['step', idx <= stepIndex && 'done', idx === stepIndex && 'cur']">
          <view class="dot" />
          <text>{{ s.text }}</text>
        </view>
      </view>
    </view>

    <view class="no card">
      <view>
        <view class="no-label">订单号</view>
        <view class="no-value">{{ order.orderNo }}</view>
      </view>
      <view class="btn-black small light" @click="copy">复制</view>
    </view>
    <view v-if="order.deliveryType === 'pickup' && order.status !== 'refunded'" class="no card">
      <view>
        <view class="no-label">取货码（到店出示）</view>
        <view class="pick-code">{{ order.orderNo.slice(-4) }}</view>
      </view>
    </view>

    <view class="card block">
      <view class="block-title">{{ order.deliveryType === 'pickup' ? '到店自提' : '配送信息' }}</view>
      <view class="addr">{{ order.address.region }} {{ order.address.detail }}</view>
      <view class="muted">{{ order.address.name }} {{ order.address.phone }}</view>
    </view>

    <view class="card block">
      <view class="block-title">商品</view>
      <view v-for="i in order.items" :key="i.productId" class="g-row">
        <image class="g-img" :src="imgUrl(i.image)" mode="aspectFill" />
        <view class="g-name">{{ i.name }}<text class="muted"> ×{{ i.qty }}</text></view>
        <text>¥{{ money(i.price * i.qty) }}</text>
      </view>
      <view class="fee"><text class="muted">商品金额</text><text>¥{{ money(order.goodsAmount) }}</text></view>
      <view v-if="order.discount" class="fee"><text class="muted">会员折扣</text><text>-¥{{ money(order.discount) }}</text></view>
      <view class="fee"><text class="muted">配送费</text><text>¥{{ money(order.deliveryFee) }}</text></view>
      <view class="fee total"><text>{{ order.status === 'unpaid' ? '应付' : '实付' }}</text><text class="price">¥{{ money(order.payAmount) }}</text></view>
    </view>

    <view class="card block info">
      <view class="kv"><text class="muted">下单时间</text><text>{{ dateTime(order.createdAt) }}</text></view>
      <view v-if="order.paidAt" class="kv"><text class="muted">支付方式</text><text>{{ order.payMethod === 'balance' ? '会员余额' : '微信支付（模拟）' }}</text></view>
      <view v-if="order.remark" class="kv"><text class="muted">备注</text><text>{{ order.remark }}</text></view>
      <view v-if="order.status === 'refunded'" class="kv"><text class="muted">退款</text><text>¥{{ money(order.payAmount) }} 已退回余额（{{ order.refundReason }}）</text></view>
    </view>

    <view style="height: 160rpx" />
    <view class="bar safe-bottom">
      <template v-if="order.status === 'unpaid'">
        <view class="btn-black ghost" @click="cancel">取消订单</view>
        <view class="btn-black" @click="pay">立即支付 ¥{{ money(order.payAmount) }}</view>
      </template>
      <template v-else>
        <view class="btn-black ghost" @click="callStore">联系商家</view>
        <view class="btn-black" @click="again">再来一单</view>
      </template>
    </view>

    <mock-pay-sheet
      :show="sheet.show"
      :amount="sheet.amount"
      :description="sheet.description"
      :loading="sheet.loading"
      @confirm="sheet.onConfirm()"
      @cancel="sheet.onCancel()"
    />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app'
import { STORE } from '../../config'
import { api, imgUrl } from '../../utils/request'
import { money, dateTime, STATUS } from '../../utils/format'
import { usePay } from '../../utils/usePay'
import { addToCart, cart, userState, refreshUser } from '../../store'

const { sheet, payOrder } = usePay()
const order = ref(null)
const justPaid = ref(false)
let id = ''
let timer = null

const st = computed(() => STATUS[order.value.status] || {})
const steps = computed(() => {
  if (!order.value || ['unpaid', 'cancelled', 'refunded'].includes(order.value.status)) return []
  return [
    { key: 'pending', text: '待接单' },
    { key: 'preparing', text: '备货中' },
    { key: 'delivering', text: order.value.deliveryType === 'pickup' ? '待取货' : '配送中' },
    { key: 'completed', text: '已完成' }
  ]
})
const stepIndex = computed(() => steps.value.findIndex((s) => s.key === order.value.status))

async function load() {
  order.value = await api.get(`/api/orders/${id}`)
}

onLoad((q) => {
  id = q.id
  justPaid.value = q.paid === '1'
})
onShow(() => {
  load()
  clearInterval(timer)
  timer = setInterval(() => load().catch(() => {}), 10000)
})
onHide(() => clearInterval(timer))
onUnload(() => clearInterval(timer))

function copy() {
  uni.setClipboardData({ data: order.value.orderNo })
}
function cancel() {
  uni.showModal({
    title: '取消订单',
    content: '确定取消该订单吗？',
    success: async (r) => {
      if (!r.confirm) return
      order.value = await api.post(`/api/orders/${id}/cancel`)
    }
  })
}
async function pay() {
  await refreshUser()
  const enough = userState.user.balance >= order.value.payAmount
  const options = [enough ? `会员余额支付（余额 ¥${money(userState.user.balance)}）` : '会员余额不足', '微信支付（模拟）']
  uni.showActionSheet({
    itemList: options,
    success: async ({ tapIndex }) => {
      if (tapIndex === 0 && !enough) return uni.navigateTo({ url: '/pages/vip/vip' })
      const ok = await payOrder(id, tapIndex === 0 ? 'balance' : 'wechat')
      if (ok) {
        justPaid.value = true
        load()
      }
    }
  })
}
function callStore() {
  uni.makePhoneCall({ phoneNumber: STORE.phone, fail() {} })
}
function again() {
  order.value.items.forEach((i) => addToCart({ id: i.productId, name: i.name, price: i.price, unit: i.unit, image: i.image }, i.qty))
  cart.deliveryType = order.value.deliveryType
  uni.switchTab({ url: '/pages/cart/cart' })
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
.status {
  padding: 40rpx 32rpx;
}
.paid-badge {
  display: inline-block;
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  background: #e3eedb;
  color: #4e7a3a;
  font-size: 24rpx;
  margin-bottom: 16rpx;
}
.st-text {
  font-size: 52rpx;
  font-weight: 800;
}
.st-desc {
  margin-top: 8rpx;
  color: $ink-2;
}
.steps {
  margin-top: 36rpx;
  display: flex;
  justify-content: space-between;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    left: 40rpx;
    right: 40rpx;
    top: 10rpx;
    height: 4rpx;
    background: #ddd5c8;
  }
}
.step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 25%;
  font-size: 22rpx;
  color: $ink-3;
  .dot {
    width: 24rpx;
    height: 24rpx;
    border-radius: 50%;
    background: #ddd5c8;
    margin-bottom: 10rpx;
  }
  &.done {
    color: $ink;
    .dot {
      background: $ink;
    }
  }
  &.cur {
    font-weight: 700;
    .dot {
      box-shadow: 0 0 0 8rpx rgba(20, 18, 16, 0.15);
    }
  }
}
.no {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.no-label {
  font-size: 24rpx;
  color: $ink-2;
}
.no-value {
  margin-top: 6rpx;
  font-size: 36rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  font-family: Menlo, Consolas, monospace;
}
.pick-code {
  margin-top: 6rpx;
  font-size: 72rpx;
  font-weight: 800;
  letter-spacing: 12rpx;
}
.block-title {
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 14rpx;
}
.addr {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}
.g-row {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
}
.g-img {
  width: 80rpx;
  height: 80rpx;
  border-radius: 14rpx;
}
.g-name {
  flex: 1;
  margin: 0 20rpx;
  font-size: 26rpx;
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
  gap: 30rpx;
  padding: 8rpx 0;
  font-size: 26rpx;
  text:last-child {
    text-align: right;
  }
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
