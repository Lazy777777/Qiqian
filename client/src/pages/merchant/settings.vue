<template>
  <view class="page">
    <view class="form card">
      <view class="field">
        <text class="label">起送价（元）</text>
        <input v-model="minYuan" class="input" type="digit" placeholder="15" />
      </view>
    </view>
    <view class="tip">商品金额（不含配送费、会员折扣前）达到起送价才能下单，填 0 表示不限制。用户端购物车和结算页会显示「还差 ¥x 起送」。</view>
    <button class="btn-black save" :disabled="saving" @click="save">保存</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, getMerchantToken } from '../../utils/request'

const minYuan = ref('')
const saving = ref(false)

onShow(async () => {
  if (!getMerchantToken()) return uni.redirectTo({ url: '/pages/merchant/login' })
  const s = await api.get('/api/merchant/settings', { merchant: true })
  minYuan.value = String(s.minOrderAmount / 100)
})

async function save() {
  const v = parseFloat(minYuan.value || '0')
  if (!(v >= 0)) return uni.showToast({ title: '请填写正确的金额', icon: 'none' })
  saving.value = true
  try {
    const s = await api.put('/api/merchant/settings', { minOrderAmount: Math.round(v * 100) }, { merchant: true })
    minYuan.value = String(s.minOrderAmount / 100)
    uni.showToast({ title: '已保存', icon: 'success' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  padding: 20rpx 28rpx 60rpx;
}
.form {
  padding: 0 28rpx;
}
.field {
  display: flex;
  align-items: center;
  min-height: 100rpx;
}
.label {
  width: 200rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.input {
  flex: 1;
  font-size: 28rpx;
}
.tip {
  margin: 20rpx 8rpx 0;
  font-size: 22rpx;
  line-height: 1.6;
  color: $ink-3;
}
.save {
  margin-top: 40rpx;
}
</style>
