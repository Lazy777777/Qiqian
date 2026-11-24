<template>
  <view class="page">
    <view class="pic card" @click="chooseImage">
      <image v-if="form.image" class="pic-img" :src="imgUrl(form.image)" mode="aspectFit" />
      <view v-else class="pic-empty">＋ 上传商品图片</view>
      <view class="pic-tip">{{ uploading ? '上传中…' : '点击更换图片（≤5MB）' }}</view>
    </view>

    <view class="form card">
      <view class="field">
        <text class="label">商品名称</text>
        <input v-model="form.name" class="input" placeholder="如：烟台红富士苹果" maxlength="30" />
      </view>
      <view class="field">
        <text class="label">分类</text>
        <picker :range="categories" range-key="name" :value="catIndex" class="input" @change="(e) => (form.categoryId = categories[e.detail.value].id)">
          <view :class="!form.categoryId && 'muted'">{{ catName || '请选择分类' }} ›</view>
        </picker>
      </view>
      <view class="field">
        <text class="label">售价（元）</text>
        <input v-model="form.priceYuan" class="input" type="digit" placeholder="0.00" />
      </view>
      <view class="field">
        <text class="label">原价（元）</text>
        <input v-model="form.originalYuan" class="input" type="digit" placeholder="选填，用于划线价" />
      </view>
      <view class="field">
        <text class="label">单位</text>
        <input v-model="form.unit" class="input" placeholder="份 / 箱 / 袋" maxlength="4" />
      </view>
      <view class="field">
        <text class="label">库存</text>
        <input v-model="form.stock" class="input" type="number" placeholder="99" />
      </view>
      <view class="field">
        <text class="label">描述</text>
        <input v-model="form.desc" class="input" placeholder="规格、卖点" maxlength="40" />
      </view>
      <view class="field">
        <text class="label">图片地址</text>
        <input v-model="form.image" class="input" placeholder="上传或粘贴图片 URL" />
      </view>
      <view class="field">
        <text class="label">上架销售</text>
        <switch :checked="form.onSale" color="#ff7a59" style="transform: scale(0.8)" @change="(e) => (form.onSale = e.detail.value)" />
      </view>
    </view>
    <button class="btn-black save" :disabled="saving" @click="save">保存</button>
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api, imgUrl, uploadImage } from '../../utils/request'

const categories = ref([])
const form = reactive({ name: '', categoryId: '', priceYuan: '', originalYuan: '', unit: '份', stock: '99', desc: '', image: '', onSale: true })
const saving = ref(false)
const uploading = ref(false)
let id = ''

const catIndex = computed(() => Math.max(0, categories.value.findIndex((c) => c.id === form.categoryId)))
const catName = computed(() => (categories.value.find((c) => c.id === form.categoryId) || {}).name)

onLoad(async (q) => {
  id = q.id || ''
  uni.setNavigationBarTitle({ title: id ? '编辑商品' : '新增商品' })
  const d = await api.get('/api/merchant/products', { merchant: true })
  categories.value = d.categories
  form.categoryId = q.categoryId || ''
  const p = d.products.find((x) => x.id === id)
  if (p) {
    Object.assign(form, {
      name: p.name,
      categoryId: p.categoryId,
      priceYuan: (p.price / 100).toFixed(2),
      originalYuan: p.originalPrice ? (p.originalPrice / 100).toFixed(2) : '',
      unit: p.unit,
      stock: String(p.stock),
      desc: p.desc,
      image: p.image,
      onSale: p.onSale
    })
  }
})

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (r) => {
      uploading.value = true
      try {
        form.image = await uploadImage(r.tempFilePaths[0])
      } finally {
        uploading.value = false
      }
    }
  })
}

async function save() {
  const price = Math.round(parseFloat(form.priceYuan) * 100)
  if (!form.name.trim()) return uni.showToast({ title: '请填写商品名称', icon: 'none' })
  if (!form.categoryId) return uni.showToast({ title: '请选择分类', icon: 'none' })
  if (!(price > 0)) return uni.showToast({ title: '请填写正确的售价', icon: 'none' })
  const body = {
    name: form.name,
    categoryId: form.categoryId,
    price,
    originalPrice: form.originalYuan ? Math.round(parseFloat(form.originalYuan) * 100) : null,
    unit: form.unit,
    stock: Number(form.stock || 0),
    desc: form.desc,
    image: form.image,
    onSale: form.onSale
  }
  saving.value = true
  try {
    if (id) await api.put(`/api/merchant/products/${id}`, body, { merchant: true })
    else await api.post('/api/merchant/products', body, { merchant: true })
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  padding: 20rpx 28rpx 60rpx;
}
.pic {
  padding: 24rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pic-img,
.pic-empty {
  width: 280rpx;
  height: 280rpx;
  border-radius: 24rpx;
}
.pic-empty {
  border: 2rpx dashed $ink-3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $ink-2;
}
.pic-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.form {
  padding: 0 28rpx;
}
.field {
  display: flex;
  align-items: center;
  min-height: 100rpx;
  & + .field {
    border-top: 1rpx solid #edf1f3;
  }
}
.label {
  width: 170rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.input {
  flex: 1;
  font-size: 28rpx;
}
.save {
  margin-top: 40rpx;
}
</style>
