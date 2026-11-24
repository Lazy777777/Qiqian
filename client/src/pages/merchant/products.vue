<template>
  <view class="page">
    <scroll-view scroll-x class="cats" :show-scrollbar="false">
      <view class="cats-inner">
        <view :class="['cat', active === 'all' && 'on']" @click="active = 'all'">全部 {{ products.length }}</view>
        <view
          v-for="c in categories"
          :key="c.id"
          :class="['cat', active === c.id && 'on']"
          @click="active = c.id"
          @longpress="removeCategory(c)"
        >{{ c.name }}</view>
        <view class="cat add" @click="addCategory">＋ 分类</view>
      </view>
    </scroll-view>

    <view v-for="p in list" :key="p.id" :class="['item card', !p.onSale && 'off']">
      <image class="img" :src="imgUrl(p.image)" mode="aspectFit" />
      <view class="info">
        <view class="name">{{ p.name }}</view>
        <view class="meta">{{ catName(p.categoryId) }} · 库存 {{ p.stock }} · 销量 {{ p.sales }}</view>
        <view class="row">
          <text class="price">¥{{ money(p.price) }}<text class="unit">/{{ p.unit }}</text></text>
          <view class="sale">
            <text>{{ p.onSale ? '在售' : '已下架' }}</text>
            <switch :checked="p.onSale" color="#ff7a59" style="transform: scale(0.7)" @change="toggleSale(p)" />
          </view>
        </view>
        <view class="ops">
          <text class="op" @click="edit(p)">编辑</text>
          <text class="op danger" @click="remove(p)">删除</text>
        </view>
      </view>
    </view>
    <view v-if="loaded && !list.length" class="empty"><text class="empty-text">暂无商品</text></view>
    <view class="hint">长按分类可删除空分类</view>
    <view style="height: 160rpx" />
    <view class="bar safe-bottom">
      <view class="btn-black" @click="edit()">＋ 新增商品</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, imgUrl } from '../../utils/request'
import { money } from '../../utils/format'

const categories = ref([])
const products = ref([])
const active = ref('all')
const loaded = ref(false)
const list = computed(() => (active.value === 'all' ? products.value : products.value.filter((p) => p.categoryId === active.value)))
const catName = (id) => (categories.value.find((c) => c.id === id) || {}).name || '未分类'

async function load() {
  const d = await api.get('/api/merchant/products', { merchant: true })
  categories.value = d.categories
  products.value = d.products
  loaded.value = true
}
onShow(load)

async function toggleSale(p) {
  const r = await api.put(`/api/merchant/products/${p.id}`, { onSale: !p.onSale }, { merchant: true })
  Object.assign(p, r)
  uni.showToast({ title: r.onSale ? '已上架' : '已下架', icon: 'none' })
}
function edit(p) {
  const q = p ? `?id=${p.id}` : active.value !== 'all' ? `?categoryId=${active.value}` : ''
  uni.navigateTo({ url: '/pages/merchant/product-edit' + q })
}
function remove(p) {
  uni.showModal({
    title: '删除商品',
    content: `确定删除「${p.name}」吗？`,
    confirmColor: '#f0564a',
    success: async (r) => {
      if (!r.confirm) return
      await api.del(`/api/merchant/products/${p.id}`, { merchant: true })
      load()
    }
  })
}
function addCategory() {
  uni.showModal({
    title: '新增分类',
    editable: true,
    placeholderText: '分类名称',
    success: async (r) => {
      if (!r.confirm || !r.content) return
      const c = await api.post('/api/merchant/categories', { name: r.content }, { merchant: true })
      await load()
      active.value = c.id
    }
  })
}
function removeCategory(c) {
  uni.showModal({
    title: '删除分类',
    content: `确定删除分类「${c.name}」吗？`,
    success: async (r) => {
      if (!r.confirm) return
      await api.del(`/api/merchant/categories/${c.id}`, { merchant: true })
      active.value = 'all'
      load()
    }
  })
}
</script>

<style lang="scss" scoped>
.page {
  padding: 0 28rpx;
}
.cats {
  white-space: nowrap;
  padding: 20rpx 0;
}
.cats-inner {
  display: inline-flex;
  gap: 14rpx;
}
.cat {
  padding: 0 26rpx;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 999rpx;
  background: $card-2;
  font-size: 24rpx;
  color: $ink-2;
  &.on {
    background: $primary;
    color: #fff;
  }
  &.add {
    border: 2rpx dashed $ink-3;
    background: transparent;
  }
}
.item {
  display: flex;
  padding: 20rpx;
  margin-bottom: 18rpx;
  border-radius: $radius;
  &.off {
    opacity: 0.6;
  }
}
.img {
  width: 168rpx;
  height: 168rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}
.info {
  flex: 1;
  margin-left: 20rpx;
  min-width: 0;
}
.name {
  font-size: 30rpx;
  font-weight: 700;
}
.meta {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.row {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .price {
    font-size: 32rpx;
  }
  .unit {
    font-size: 22rpx;
    font-weight: 400;
    color: $ink-3;
  }
}
.sale {
  display: flex;
  align-items: center;
  font-size: 22rpx;
  color: $ink-2;
}
.ops {
  display: flex;
  justify-content: flex-end;
  gap: 32rpx;
  font-size: 24rpx;
  .op {
    color: $ink-2;
    text-decoration: underline;
  }
  .danger {
    color: $danger;
  }
}
.hint {
  text-align: center;
  font-size: 22rpx;
  color: $ink-3;
  padding: 16rpx 0;
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
