<template>
  <view class="page">
    <view v-if="select" class="hint">请选择收货地址</view>
    <view v-for="a in list" :key="a.id" :class="['addr card', select && a.id === checkoutState.addressId && 'picked']" @click="choose(a)">
      <view class="a-top">
        <text v-if="a.isDefault" class="tag dark">默认</text>
        <text v-if="a.tag" class="tag">{{ a.tag }}</text>
        <text class="a-detail">{{ a.region }} {{ a.detail }}</text>
      </view>
      <view class="a-contact">{{ a.name }} {{ a.phone }}</view>
      <view class="a-actions">
        <view class="act" @click.stop="setDefault(a)">
          <view :class="['radio', a.isDefault && 'on']" />
          <text>{{ a.isDefault ? '默认地址' : '设为默认' }}</text>
        </view>
        <view class="act-right">
          <text class="act-link" @click.stop="edit(a)">编辑</text>
          <text class="act-link" @click.stop="remove(a)">删除</text>
        </view>
      </view>
    </view>

    <view v-if="loaded && !list.length" class="empty">
      <text class="empty-text">还没有收货地址</text>
    </view>
    <view style="height: 160rpx" />
    <view class="bar safe-bottom">
      <view class="btn-black" @click="edit()">＋ 新增收货地址</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api } from '../../utils/request'
import { ensureLogin, checkoutState } from '../../store'

const list = ref([])
const loaded = ref(false)
const select = ref(false)

onLoad((q) => (select.value = q.select === '1'))
onShow(load)
async function load() {
  await ensureLogin()
  list.value = await api.get('/api/addresses')
  loaded.value = true
}

function choose(a) {
  if (!select.value) return
  checkoutState.addressId = a.id
  uni.navigateBack()
}
async function setDefault(a) {
  if (a.isDefault) return
  await api.put(`/api/addresses/${a.id}`, { ...a, isDefault: true })
  load()
}
function edit(a) {
  uni.navigateTo({ url: '/pages/address/edit' + (a ? `?id=${a.id}` : '') })
}
function remove(a) {
  uni.showModal({
    title: '删除地址',
    content: '确定删除该收货地址吗？',
    success: async (r) => {
      if (!r.confirm) return
      await api.del(`/api/addresses/${a.id}`)
      if (checkoutState.addressId === a.id) checkoutState.addressId = ''
      load()
    }
  })
}
</script>

<style lang="scss" scoped>
.page {
  padding: 20rpx 28rpx;
}
.hint {
  font-size: 24rpx;
  color: $ink-2;
  padding: 0 8rpx 16rpx;
}
.addr {
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 3rpx solid transparent;
  &.picked {
    border-color: $primary;
  }
}
.a-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
}
.tag.dark {
  background: $primary;
  color: #fff;
}
.a-detail {
  font-size: 30rpx;
  font-weight: 700;
}
.a-contact {
  margin-top: 10rpx;
  color: $ink-2;
  font-size: 26rpx;
}
.a-actions {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #edf1f3;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
}
.act {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.radio {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #c5cdd5;
  &.on {
    border: 10rpx solid $primary;
  }
}
.act-link {
  margin-left: 32rpx;
  color: $ink-2;
}
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx;
  background: $bg;
}
</style>
