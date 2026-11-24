<template>
  <view class="page">
    <image class="illus" src="/static/illus/noodle.png" mode="aspectFit" />
    <view class="title">MERCHANT</view>
    <view class="sub">{{ store.name }} · 商家后台</view>
    <view class="form card">
      <input v-model="password" class="input" password placeholder="请输入商家密码" confirm-type="done" @confirm="login" />
    </view>
    <button class="btn-black" :disabled="loading" @click="login">登录</button>
    <view class="tip">默认密码 admin123，可通过后端环境变量 MERCHANT_PASSWORD 修改</view>
    <view class="back" @click="back">返回用户端</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { STORE } from '../../config'
import { api, getMerchantToken, setMerchantToken } from '../../utils/request'

const store = STORE
const password = ref('')
const loading = ref(false)

onShow(() => {
  if (getMerchantToken()) uni.redirectTo({ url: '/pages/merchant/orders' })
})

async function login() {
  if (!password.value) return uni.showToast({ title: '请输入密码', icon: 'none' })
  loading.value = true
  try {
    const { token } = await api.post('/api/merchant/login', { password: password.value })
    setMerchantToken(token)
    uni.redirectTo({ url: '/pages/merchant/orders' })
  } finally {
    loading.value = false
  }
}
const back = () => uni.switchTab({ url: '/pages/index/index' })
</script>

<style lang="scss" scoped>
.page {
  padding: 80rpx 56rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.illus {
  width: 200rpx;
  height: 200rpx;
}
.title {
  margin-top: 20rpx;
  font-size: 64rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
}
.sub {
  margin: 8rpx 0 56rpx;
  color: $ink-2;
}
.form {
  width: 100%;
  padding: 0 32rpx;
  margin-bottom: 32rpx;
}
.input {
  height: 104rpx;
  font-size: 30rpx;
}
.btn-black {
  width: 100%;
}
.tip {
  margin-top: 24rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.back {
  margin-top: 60rpx;
  font-size: 26rpx;
  color: $ink-2;
  text-decoration: underline;
}
</style>
