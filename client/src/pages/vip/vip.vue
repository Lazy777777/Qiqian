<template>
  <view class="page">
    <view class="vip card">
      <view class="vip-left">
        <view class="vip-title">VIP</view>
        <view class="vip-level">{{ user ? user.vip.name : '' }}</view>
        <view class="vip-meta">
          <text>¥{{ money(user ? user.balance : 0) }}</text>
          <text class="sep">|</text>
          <text>积分 {{ user ? user.points : 0 }}</text>
        </view>
        <view class="vip-perk">{{ user ? user.vip.perks : '' }}</view>
      </view>
      <image class="vip-img" src="/static/illus/vip-character.svg" mode="aspectFit" />
    </view>

    <view v-if="user && user.nextVip" class="progress card">
      <view class="p-text">累计充值 ¥{{ yuan(user.totalRecharge) }}，再充 <text class="strong">¥{{ yuan(user.nextVip.need) }}</text> 升级{{ user.nextVip.name }}</view>
      <view class="p-bar"><view class="p-fill" :style="{ width: progress + '%' }" /></view>
    </view>

    <view class="section-title">余额充值</view>
    <view class="plans">
      <view v-for="p in plans" :key="p.amount" :class="['plan', selected === p.amount && 'on']" @click="selected = p.amount">
        <view class="plan-amt"><text class="sym">¥</text>{{ yuan(p.amount) }}</view>
        <view class="plan-bonus">{{ p.bonus ? `送 ¥${yuan(p.bonus)}` : '无赠送' }}</view>
      </view>
    </view>
    <button class="btn-black pay" :disabled="paying" @click="doRecharge">立即充值 ¥{{ yuan(selected) }}</button>
    <view class="agree">充值即视为同意《会员储值协议》，余额可用于本店消费，退款将原路退回余额。</view>

    <view class="section-title">会员权益</view>
    <view class="levels card">
      <view v-for="l in levels" :key="l.level" :class="['lv', user && user.vip.level === l.level && 'cur']">
        <view class="lv-name">{{ l.name }}</view>
        <view class="lv-cond">{{ l.min ? `累计充值 ¥${yuan(l.min)}` : '注册即享' }}</view>
        <view class="lv-perk">{{ l.perks }}</view>
      </view>
    </view>

    <view class="section-title">余额明细</view>
    <view class="logs card">
      <view v-for="l in logs" :key="l.id" class="log">
        <view>
          <view>{{ l.remark }}</view>
          <view class="muted small">{{ dateTime(l.createdAt) }}</view>
        </view>
        <text :class="['chg', l.change > 0 ? 'plus' : 'minus']">{{ l.change > 0 ? '+' : '' }}{{ money(l.change) }}</text>
      </view>
      <view v-if="!logs.length" class="muted none">暂无记录</view>
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
import { onShow } from '@dcloudio/uni-app'
import { api } from '../../utils/request'
import { money, yuan, dateTime } from '../../utils/format'
import { usePay } from '../../utils/usePay'
import { userState, refreshUser, loadConfig } from '../../store'

const { sheet, recharge } = usePay()
const user = computed(() => userState.user)
const plans = computed(() => (userState.config ? userState.config.rechargePlans : []))
const levels = computed(() => (userState.config ? userState.config.vipLevels : []))
const selected = ref(10000)
const paying = ref(false)
const logs = ref([])

const progress = computed(() => {
  const u = user.value
  if (!u || !u.nextVip) return 100
  const target = u.totalRecharge + u.nextVip.need
  return Math.min(100, Math.round((u.totalRecharge / target) * 100))
})

async function load() {
  await Promise.all([refreshUser(), loadConfig()])
  logs.value = await api.get('/api/user/balance-logs')
}
onShow(load)

async function doRecharge() {
  paying.value = true
  try {
    const ok = await recharge(selected.value)
    if (ok) {
      uni.showToast({ title: '充值成功', icon: 'success' })
      load()
    }
  } finally {
    paying.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  padding: 20rpx 28rpx 60rpx;
}
.card {
  margin-bottom: 24rpx;
}
.vip {
  padding: 40rpx 24rpx 36rpx 48rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.vip-title {
  font-size: 96rpx;
  font-weight: 600;
  line-height: 1;
}
.vip-level {
  margin-top: 10rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: $accent-dark;
}
.vip-meta {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: $ink-2;
  .sep {
    margin: 0 14rpx;
  }
}
.vip-perk {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.vip-img {
  width: 220rpx;
  height: 250rpx;
}
.progress {
  padding: 28rpx;
  .p-text {
    font-size: 24rpx;
    color: $ink-2;
    .strong {
      color: $ink;
      font-weight: 700;
    }
  }
  .p-bar {
    margin-top: 16rpx;
    height: 14rpx;
    border-radius: 999rpx;
    background: $card-2;
    overflow: hidden;
  }
  .p-fill {
    height: 100%;
    background: $ink;
    border-radius: 999rpx;
  }
}
.plans {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.plan {
  width: calc(50% - 10rpx);
  background: $card;
  border-radius: $radius;
  padding: 28rpx;
  border: 3rpx solid transparent;
  &.on {
    border-color: $ink;
    background: #fff;
  }
}
.plan-amt {
  font-size: 48rpx;
  font-weight: 800;
  .sym {
    font-size: 28rpx;
  }
}
.plan-bonus {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: $accent-dark;
}
.pay {
  margin-top: 32rpx;
}
.agree {
  margin: 16rpx 0 24rpx;
  font-size: 22rpx;
  color: $ink-3;
  text-align: center;
}
.section-title {
  margin-top: 16rpx;
}
.levels {
  padding: 8rpx 28rpx;
}
.lv {
  padding: 22rpx 0;
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-size: 24rpx;
  & + .lv {
    border-top: 1rpx solid #e6dfd2;
  }
  &.cur .lv-name {
    background: $ink;
    color: #fff;
  }
}
.lv-name {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: $card-2;
  font-weight: 700;
  flex-shrink: 0;
}
.lv-cond {
  color: $ink-2;
  width: 220rpx;
}
.lv-perk {
  flex: 1;
  text-align: right;
}
.logs {
  padding: 8rpx 28rpx;
}
.log {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22rpx 0;
  font-size: 26rpx;
  & + .log {
    border-top: 1rpx solid #e6dfd2;
  }
  .small {
    font-size: 22rpx;
    margin-top: 4rpx;
  }
}
.chg {
  font-weight: 700;
  &.plus {
    color: #4e7a3a;
  }
}
.none {
  padding: 30rpx 0;
  text-align: center;
}
</style>
