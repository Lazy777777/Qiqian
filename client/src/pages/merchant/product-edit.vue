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
        <input v-model="form.name" class="input" placeholder="如：咔吡咔吡辣白菜20包" maxlength="40" />
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
        <input v-model="form.unit" class="input" placeholder="整件单位：袋 / 箱 / 组" maxlength="4" />
      </view>
      <view class="field">
        <text class="label">库存</text>
        <input v-model="form.stock" class="input" type="number" placeholder="99" />
      </view>
      <view class="field">
        <text class="label">描述</text>
        <input v-model="form.desc" class="input" placeholder="规格、卖点" maxlength="40" />
      </view>
      <view class="field top">
        <text class="label">商品详情</text>
        <textarea v-model="form.detail" class="input area" auto-height placeholder="选填，顾客在商品详情里可以看到" maxlength="500" />
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

    <view class="form card spec-card">
      <view class="field">
        <text class="label">拆包销售</text>
        <view class="switch-row">
          <text class="muted small">开启后有「整件 / 单包」两个规格</text>
          <switch :checked="form.split" color="#ff7a59" style="transform: scale(0.8)" @change="(e) => toggleSplit(e.detail.value)" />
        </view>
      </view>
      <template v-if="form.split">
        <view class="field">
          <text class="label">整件件数</text>
          <input v-model="form.packCount" class="input" type="number" placeholder="如 20（整件含 20 包）" />
        </view>
        <view class="field">
          <text class="label">单包单位</text>
          <input v-model="form.singleUnit" class="input" placeholder="包 / 瓶 / 根 / 个" maxlength="2" />
        </view>
        <view class="field">
          <text class="label">单包价（元）</text>
          <input v-model="form.singleYuan" class="input" type="digit" placeholder="0.00" />
          <text class="rule-btn" @click="applyRule">按规则</text>
        </view>
        <view class="field">
          <text class="label">散包库存</text>
          <input v-model="form.looseStock" class="input" type="number" placeholder="已拆开剩余的单包数" />
        </view>
        <view class="rule-tip">
          <text v-if="perUnit">整件均价 ¥{{ perUnit }}/{{ form.singleUnit || '包' }}，</text>规则：均价不到 1 元按 1 元/包，超过 1 元按 2 元/包。单包库存 = 整件库存 × 件数 + 散包库存。
          <text v-if="belowAvg" class="warn">当前单包价低于整件均价，拆开卖会亏本，请确认。</text>
        </view>
      </template>
    </view>
    <button class="btn-black save" :disabled="saving" @click="save">保存</button>
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api, imgUrl, uploadImage } from '../../utils/request'
import { ruleSinglePrice } from '../../utils/format'

const categories = ref([])
const form = reactive({
  name: '', categoryId: '', priceYuan: '', originalYuan: '', unit: '份', stock: '99', desc: '', detail: '', image: '', onSale: true,
  split: false, packCount: '', singleUnit: '包', singleYuan: '', looseStock: '0'
})
const saving = ref(false)
const uploading = ref(false)
let id = ''

const catIndex = computed(() => Math.max(0, categories.value.findIndex((c) => c.id === form.categoryId)))
const fen = (v) => Math.round(parseFloat(v) * 100)
const perUnit = computed(() => {
  const price = fen(form.priceYuan)
  const n = Number(form.packCount)
  return price > 0 && n > 1 ? (price / n / 100).toFixed(2) : ''
})
const belowAvg = computed(() => perUnit.value && fen(form.singleYuan) < Math.round(parseFloat(perUnit.value) * 100))

function guessPackCount() {
  const m = form.name.match(/(\d+)\s*(包|瓶|根|个|盒|袋|片|桶)/g)
  if (!m) return ''
  const last = m[m.length - 1].match(/(\d+)\s*(.)/)
  return Number(last[1]) > 1 ? { count: last[1], unit: last[2] } : ''
}
function toggleSplit(v) {
  form.split = v
  if (v && !form.packCount) {
    const g = guessPackCount()
    if (g) {
      form.packCount = g.count
      form.singleUnit = g.unit
    }
  }
  if (v && !form.singleYuan) applyRule(true)
}
function applyRule(silent) {
  const p = ruleSinglePrice(fen(form.priceYuan), Number(form.packCount))
  if (!p) {
    if (silent !== true) uni.showToast({ title: '请先填写售价和整件件数', icon: 'none' })
    return
  }
  form.singleYuan = (p / 100).toFixed(2)
}

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
      detail: p.detail || '',
      image: p.image,
      onSale: p.onSale,
      split: !!(p.packCount > 1 && p.singlePrice),
      packCount: p.packCount > 1 ? String(p.packCount) : '',
      singleUnit: p.singleUnit || '包',
      singleYuan: p.singlePrice ? (p.singlePrice / 100).toFixed(2) : '',
      looseStock: String(p.looseStock || 0)
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
  if (form.split && !(Number(form.packCount) > 1)) return uni.showToast({ title: '整件件数至少为 2', icon: 'none' })
  if (form.split && !(fen(form.singleYuan) > 0)) return uni.showToast({ title: '请填写单包价', icon: 'none' })
  const body = {
    name: form.name,
    categoryId: form.categoryId,
    price,
    originalPrice: form.originalYuan ? Math.round(parseFloat(form.originalYuan) * 100) : null,
    unit: form.unit,
    stock: Number(form.stock || 0),
    desc: form.desc,
    detail: form.detail,
    image: form.image,
    onSale: form.onSale,
    packCount: form.split ? Number(form.packCount) : 0,
    singlePrice: form.split ? fen(form.singleYuan) : null,
    singleUnit: form.singleUnit,
    looseStock: form.split ? Number(form.looseStock || 0) : 0
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
.field.top {
  align-items: flex-start;
  padding: 28rpx 0;
}
.area {
  width: 100%;
  min-height: 80rpx;
}
.spec-card {
  margin-top: 20rpx;
}
.switch-row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .small {
    font-size: 22rpx;
  }
}
.rule-btn {
  flex-shrink: 0;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: $mint-light;
  color: #1f9e80;
  font-size: 24rpx;
  font-weight: 600;
}
.rule-tip {
  padding: 4rpx 0 28rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: $ink-3;
  .warn {
    display: block;
    color: $danger;
  }
}
</style>
