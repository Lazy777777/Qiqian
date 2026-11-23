<template>
  <view class="page">
    <!-- #ifdef MP-WEIXIN -->
    <view class="import card" @click="importWx">一键导入微信收货地址 ›</view>
    <!-- #endif -->
    <view class="form card">
      <view class="field">
        <text class="label">收货人</text>
        <input v-model="form.name" class="input" placeholder="请填写收货人姓名" maxlength="20" />
      </view>
      <view class="field">
        <text class="label">手机号</text>
        <input v-model="form.phone" class="input" type="number" placeholder="请填写 11 位手机号" maxlength="11" />
      </view>
      <view class="field">
        <text class="label">所在地区</text>
        <input v-model="form.region" class="input" placeholder="如：上海市 浦东新区" maxlength="40" />
      </view>
      <view class="field">
        <text class="label">详细地址</text>
        <input v-model="form.detail" class="input" placeholder="街道、楼栋、门牌号" maxlength="80" />
      </view>
      <view class="field">
        <text class="label">标签</text>
        <view class="tags">
          <text v-for="t in tags" :key="t" :class="['tag', form.tag === t && 'on']" @click="form.tag = form.tag === t ? '' : t">{{ t }}</text>
        </view>
      </view>
      <view class="field">
        <text class="label">设为默认</text>
        <switch :checked="form.isDefault" color="#141210" style="transform: scale(0.8)" @change="(e) => (form.isDefault = e.detail.value)" />
      </view>
    </view>
    <button class="btn-black save" :disabled="saving" @click="save">保存地址</button>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '../../utils/request'
import { checkoutState } from '../../store'

const tags = ['家', '公司', '学校']
const form = reactive({ name: '', phone: '', region: '', detail: '', tag: '', isDefault: false })
const saving = ref(false)
let id = ''

onLoad(async (q) => {
  id = q.id || ''
  uni.setNavigationBarTitle({ title: id ? '编辑地址' : '新增地址' })
  if (id) {
    const list = await api.get('/api/addresses')
    const a = list.find((x) => x.id === id)
    if (a) Object.assign(form, a)
  }
})

// #ifdef MP-WEIXIN
function importWx() {
  uni.chooseAddress({
    success: (r) => {
      form.name = r.userName
      form.phone = r.telNumber
      form.region = [r.provinceName, r.cityName, r.countyName].join(' ')
      form.detail = r.detailInfo
    }
  })
}
// #endif

async function save() {
  if (!form.name.trim()) return uni.showToast({ title: '请填写收货人', icon: 'none' })
  if (!/^1\d{10}$/.test(form.phone)) return uni.showToast({ title: '请填写正确的手机号', icon: 'none' })
  if (!form.detail.trim()) return uni.showToast({ title: '请填写详细地址', icon: 'none' })
  saving.value = true
  try {
    const a = id ? await api.put(`/api/addresses/${id}`, form) : await api.post('/api/addresses', form)
    if (!id) checkoutState.addressId = a.id
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  padding: 20rpx 28rpx;
}
.import {
  padding: 28rpx;
  margin-bottom: 20rpx;
  font-weight: 600;
}
.form {
  padding: 0 28rpx;
}
.field {
  display: flex;
  align-items: center;
  min-height: 104rpx;
  & + .field {
    border-top: 1rpx solid #e6dfd2;
  }
}
.label {
  width: 150rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.input {
  flex: 1;
  font-size: 28rpx;
}
.tags {
  display: flex;
  gap: 16rpx;
  .tag.on {
    background: $ink;
    color: #fff;
  }
}
.save {
  margin-top: 48rpx;
}
</style>
