<template>
  <view class="page">
    <view class="switch">
      <view :class="['sw', cart.deliveryType === 'delivery' && 'on']" @click="setType('delivery')">外卖配送</view>
      <view :class="['sw', cart.deliveryType === 'pickup' && 'on']" @click="setType('pickup')">到店自提</view>
    </view>

    <view v-if="cart.deliveryType === 'delivery'" class="addr card" @click="pickAddress">
      <template v-if="address">
        <view class="addr-main">
          <view class="addr-detail">{{ address.region }} {{ address.detail }}</view>
          <view class="addr-contact">{{ address.name }} {{ address.phone }}</view>
        </view>
        <text class="arrow">›</text>
      </template>
      <template v-else>
        <view class="addr-main"><view class="addr-detail">＋ 添加收货地址</view></view>
        <text class="arrow">›</text>
      </template>
    </view>

    <view v-else class="addr card pickup">
      <view class="pick-store">
        <text class="label">自提门店</text>
        <text>{{ store.name }} · {{ store.address }}</text>
      </view>
      <view class="field">
        <text class="label">取货人</text>
        <input v-model="contact.name" placeholder="请填写姓名" class="input" />
      </view>
      <view class="field">
        <text class="label">手机号</text>
        <input v-model="contact.phone" type="number" maxlength="11" placeholder="用于取货联系" class="input" />
      </view>
    </view>

    <view class="goods card">
      <view class="block-title">商品清单</view>
      <view v-for="i in items" :key="i.productId" class="g-row">
        <image class="g-img" :src="imgUrl(i.image)" mode="aspectFill" />
        <view class="g-name">{{ i.name }}<text class="muted"> ×{{ i.qty }}</text></view>
        <text class="g-price">¥{{ money(i.price * i.qty) }}</text>
      </view>
      <view class="fee"><text class="muted">商品金额</text><text>¥{{ money(preview.goodsAmount) }}</text></view>
      <view v-if="preview.discount" class="fee"><text class="muted">会员折扣（{{ preview.vip && preview.vip.name }}）</text><text class="minus">-¥{{ money(preview.discount) }}</text></view>
      <view class="fee"><text class="muted">配送费</text><text>{{ preview.deliveryFee ? '¥' + money(preview.deliveryFee) : '免配送费' }}</text></view>
      <view class="fee total"><text>实付</text><text class="price"><text class="sym">¥</text>{{ money(preview.payAmount) }}</text></view>
    </view>

    <view class="card remark">
      <text class="label">订单备注</text>
      <input v-model="remark" class="input" maxlength="100" placeholder="口味、送达时间等要求（选填）" />
    </view>

    <view class="pay card">
      <view class="block-title">支付方式</view>
      <view class="pay-row" @click="method = 'balance'">
        <view class="pay-icon vip">V</view>
        <view class="pay-name">
          <view>会员余额支付</view>
          <view class="muted small">可用余额 ¥{{ money(balance) }}<text v-if="balance < preview.payAmount" class="warn"> · 余额不足</text></view>
        </view>
        <text v-if="balance < preview.payAmount" class="go-recharge" @click.stop="goVip">去充值</text>
        <view :class="['radio', method === 'balance' && 'on']" />
      </view>
      <view class="pay-row" @click="method = 'wechat'">
        <view class="pay-icon wx">￥</view>
        <view class="pay-name">
          <view>微信支付</view>
          <view class="muted small">当前为模拟支付，不会真实扣款</view>
        </view>
        <view :class="['radio', method === 'wechat' && 'on']" />
      </view>
    </view>

    <view style="height: 180rpx" />
    <view class="bar safe-bottom">
      <view class="bar-sum">
        <text class="muted">实付 </text>
        <text class="price big"><text class="sym">¥</text>{{ money(preview.payAmount) }}</text>
      </view>
      <button class="btn-black" :disabled="submitting" @click="submit">提交订单</button>
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
import { ref, reactive, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { STORE } from '../../config'
import { api, imgUrl } from '../../utils/request'
import { money } from '../../utils/format'
import { usePay } from '../../utils/usePay'
import { cart, checkedItems, checkoutState, setQty, userState, refreshUser } from '../../store'

const store = STORE
const { sheet, payOrder } = usePay()
const addresses = ref([])
const preview = ref({ goodsAmount: 0, discount: 0, deliveryFee: 0, payAmount: 0 })
const remark = ref('')
const method = ref('balance')
const submitting = ref(false)
const contact = reactive({ name: '', phone: '' })

const items = computed(() => checkedItems.value)
const balance = computed(() => (userState.user ? userState.user.balance : 0))
const address = computed(
  () => addresses.value.find((a) => a.id === checkoutState.addressId) || addresses.value.find((a) => a.isDefault) || addresses.value[0]
)

async function loadPreview() {
  if (!items.value.length) return
  preview.value = await api.post('/api/orders/preview', {
    items: items.value.map((i) => ({ productId: i.productId, qty: i.qty })),
    deliveryType: cart.deliveryType
  })
}

onShow(async () => {
  await refreshUser()
  addresses.value = await api.get('/api/addresses')
  const def = addresses.value.find((a) => a.isDefault) || addresses.value[0]
  if (def && !contact.name) {
    contact.name = def.name
    contact.phone = def.phone
  }
  await loadPreview()
  if (balance.value < preview.value.payAmount) method.value = 'wechat'
})

watch(() => cart.deliveryType, loadPreview)

function setType(t) {
  cart.deliveryType = t
}
const pickAddress = () => uni.navigateTo({ url: '/pages/address/list?select=1' })
const goVip = () => uni.navigateTo({ url: '/pages/vip/vip' })

async function submit() {
  if (submitting.value) return
  if (cart.deliveryType === 'delivery' && !address.value) return uni.showToast({ title: '请添加收货地址', icon: 'none' })
  if (method.value === 'balance' && balance.value < preview.value.payAmount) {
    return uni.showToast({ title: '余额不足，请充值或选择微信支付', icon: 'none' })
  }
  submitting.value = true
  try {
    const order = await api.post('/api/orders', {
      items: items.value.map((i) => ({ productId: i.productId, qty: i.qty })),
      deliveryType: cart.deliveryType,
      addressId: address.value && address.value.id,
      contact,
      remark: remark.value
    })
    items.value.map((i) => i.productId).forEach((id) => setQty(id, 0))
    let paid = false
    try {
      paid = await payOrder(order.id, method.value)
    } catch (e) {}
    uni.redirectTo({ url: `/pages/order/detail?id=${order.id}${paid ? '&paid=1' : ''}` })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  padding: 20rpx 28rpx;
}
.switch {
  display: flex;
  background: $card-2;
  border-radius: 999rpx;
  padding: 6rpx;
  margin-bottom: 20rpx;
  .sw {
    flex: 1;
    text-align: center;
    height: 68rpx;
    line-height: 68rpx;
    border-radius: 999rpx;
    color: $ink-2;
    &.on {
      background: $ink;
      color: #fff;
      font-weight: 600;
    }
  }
}
.card {
  padding: 28rpx;
  margin-bottom: 20rpx;
}
.addr {
  display: flex;
  align-items: center;
  &.pickup {
    display: block;
  }
}
.addr-main {
  flex: 1;
}
.addr-detail {
  font-size: 32rpx;
  font-weight: 700;
}
.addr-contact {
  margin-top: 10rpx;
  color: $ink-2;
  font-size: 26rpx;
}
.arrow {
  font-size: 44rpx;
  color: $ink-3;
}
.label {
  font-weight: 600;
  margin-right: 20rpx;
  flex-shrink: 0;
  width: 130rpx;
}
.pick-store {
  display: flex;
  font-size: 26rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #e6dfd2;
}
.field {
  display: flex;
  align-items: center;
  padding-top: 22rpx;
}
.input {
  flex: 1;
  font-size: 28rpx;
}
.block-title {
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}
.g-row {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
}
.g-img {
  width: 88rpx;
  height: 88rpx;
  border-radius: 16rpx;
}
.g-name {
  flex: 1;
  margin: 0 20rpx;
  font-size: 26rpx;
}
.g-price {
  font-weight: 600;
}
.fee {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  padding-top: 16rpx;
  .minus {
    color: $danger;
  }
  &.total {
    margin-top: 12rpx;
    padding-top: 20rpx;
    border-top: 1rpx dashed #d5cdbf;
    font-weight: 700;
    .price {
      font-size: 36rpx;
    }
  }
}
.remark {
  display: flex;
  align-items: center;
}
.pay-row {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
}
.pay-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  color: #fff;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  &.vip {
    background: $ink;
  }
  &.wx {
    background: #07c160;
  }
}
.pay-name {
  flex: 1;
  margin-left: 20rpx;
  font-size: 28rpx;
  .small {
    font-size: 22rpx;
    margin-top: 4rpx;
  }
  .warn {
    color: $danger;
  }
}
.go-recharge {
  font-size: 24rpx;
  color: $accent-dark;
  margin-right: 20rpx;
  text-decoration: underline;
}
.radio {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #b9b1a6;
  &.on {
    border: 12rpx solid $ink;
  }
}
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: $card;
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx;
  border-radius: 36rpx 36rpx 0 0;
  box-shadow: 0 -8rpx 30rpx rgba(20, 18, 16, 0.06);
}
.bar-sum {
  flex: 1;
  .big {
    font-size: 44rpx;
  }
}
</style>
