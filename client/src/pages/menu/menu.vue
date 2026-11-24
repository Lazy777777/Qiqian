<template>
  <view class="page">
    <view class="top">
      <view class="notice">
        <text class="notice-tag">外卖配送</text>
        <text>{{ notice }}</text>
      </view>
    </view>

    <view class="body">
      <scroll-view scroll-y class="side">
        <view
          v-for="c in categories"
          :key="c.id"
          :class="['cat', active === c.id && 'on']"
          @click="active = c.id"
        >
          <text>{{ c.name }}</text>
          <text v-if="catCount[c.id]" class="cat-badge">{{ catCount[c.id] }}</text>
        </view>
      </scroll-view>

      <scroll-view scroll-y class="main" :scroll-top="scrollTop">
        <view class="cat-title">{{ activeName }}</view>
        <view v-for="p in list" :key="p.id" :class="['item card', soldOut(p) && 'off']" @click="sheetProduct = p">
          <view class="img-wrap">
            <image class="img" :src="imgUrl(p.image)" mode="aspectFill" />
            <text v-if="soldOut(p)" class="img-mask">已售罄</text>
          </view>
          <view class="info">
            <view class="name">{{ p.name }}</view>
            <view class="desc">{{ p.desc }}</view>
            <view class="tags">
              <text v-if="discountText(p)" class="tag-off">{{ discountText(p) }}</text>
              <text v-if="p.specs.length" class="tag-split">可拆 ¥{{ yuan(p.singlePrice) }}/{{ p.singleUnit }}</text>
              <text v-if="p.sales" class="sales">月售 {{ p.sales }}</text>
            </view>
            <view class="foot">
              <view>
                <text class="price"><text class="sym">¥</text>{{ yuan(p.price) }}</text>
                <text class="unit">/{{ p.unit }}</text>
                <text v-if="p.originalPrice" class="origin">¥{{ yuan(p.originalPrice) }}</text>
              </view>
              <text v-if="soldOut(p)" class="sold-out">已售罄</text>
              <view v-else-if="p.specs.length" class="spec-btn" @click.stop="sheetProduct = p">
                选规格<text v-if="qtyOf(p.id)" class="spec-num">{{ qtyOf(p.id) }}</text>
              </view>
              <qty-stepper v-else :value="qtyOf(p.id)" @change="(d) => change(p, d)" />
            </view>
          </view>
        </view>
        <view v-if="!list.length && loaded" class="empty"><text class="empty-text">该分类暂无商品</text></view>
        <view style="height: 180rpx" />
      </scroll-view>
    </view>

    <view v-if="cartCount > 0" class="bar">
      <view class="bar-left" @click="toCart">
        <view class="bag">
          <image class="bag-icon" src="/static/tab/cart-active.png" />
          <text class="bag-num">{{ cartCount }}</text>
        </view>
        <view>
          <view class="bar-total">¥{{ money(cartTotal) }}</view>
          <view class="bar-tip">{{ deliveryTip }}</view>
        </view>
      </view>
      <view v-if="shortOfMin > 0" class="bar-btn disabled">差 ¥{{ yuan(shortOfMin) }} 起送</view>
      <view v-else class="bar-btn" @click="checkout">去结算</view>
    </view>

    <product-sheet :product="sheetProduct" @close="sheetProduct = null" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, imgUrl } from '../../utils/request'
import { yuan, money, discountText } from '../../utils/format'
import {
  cart, menuState, cartCount, cartTotal, shortOfMin, qtyOf, canAdd, addToCart, syncCartWithMenu, userState, loadConfig, ensureLogin
} from '../../store'

const categories = ref([])
const products = ref([])
const active = ref('')
const loaded = ref(false)
const scrollTop = ref(0)
const sheetProduct = ref(null)
const soldOut = (p) => p.stock <= 0 && !(p.looseStock > 0)

const list = computed(() => products.value.filter((p) => p.categoryId === active.value))
const activeName = computed(() => (categories.value.find((c) => c.id === active.value) || {}).name || '')
const catCount = computed(() => {
  const m = {}
  for (const i of cart.items) {
    const p = products.value.find((x) => x.id === i.productId)
    if (p) m[p.categoryId] = (m[p.categoryId] || 0) + i.qty
  }
  return m
})

const notice = computed(() => {
  const cfg = userState.config
  if (!cfg) return '外卖配送，最快 30 分钟送到宿舍楼下'
  return `满 ¥${yuan(cfg.minOrderAmount)} 起送 · 满 ¥${yuan(cfg.freeDeliveryThreshold)} 免配送费`
})
const deliveryTip = computed(() => {
  const cfg = userState.config
  if (!cfg) return ''
  if (shortOfMin.value > 0) return `满 ¥${yuan(cfg.minOrderAmount)} 起送`
  const gap = cfg.freeDeliveryThreshold - cartTotal.value
  return gap > 0 ? `再买 ¥${yuan(gap)} 免配送费` : '已免配送费'
})

onShow(async () => {
  loadConfig().catch(() => {})
  const d = await api.get('/api/menu')
  categories.value = d.categories
  products.value = d.products
  if (menuState.category) {
    active.value = menuState.category
    menuState.category = ''
  }
  if (!active.value || !d.categories.some((c) => c.id === active.value)) active.value = d.categories[0]?.id || ''
  syncCartWithMenu(d.products)
  loaded.value = true
})

function change(p, d) {
  if (d > 0 && !canAdd(p)) return uni.showToast({ title: '库存不足', icon: 'none' })
  addToCart(p, d)
}
const toCart = () => uni.switchTab({ url: '/pages/cart/cart' })
async function checkout() {
  await ensureLogin()
  if (!cart.items.some((i) => i.checked)) return uni.showToast({ title: '请在购物车勾选商品', icon: 'none' })
  if (shortOfMin.value > 0) return uni.showToast({ title: `还差 ¥${yuan(shortOfMin.value)} 起送`, icon: 'none' })
  uni.navigateTo({ url: '/pages/checkout/checkout' })
}
</script>

<style lang="scss" scoped>
.page {
  height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
  display: flex;
  flex-direction: column;
}
.top {
  padding: 16rpx 28rpx 12rpx;
}
.notice {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx 24rpx;
  border-radius: 999rpx;
  background: $mint-light;
  font-size: 24rpx;
  color: $ink-2;
}
.notice-tag {
  flex-shrink: 0;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background: $mint;
  color: #fff;
  font-weight: 700;
  font-size: 22rpx;
}
.body {
  flex: 1;
  display: flex;
  min-height: 0;
}
.side {
  width: 176rpx;
  height: 100%;
  background: $card-2;
  border-radius: 0 32rpx 0 0;
}
.cat {
  position: relative;
  padding: 32rpx 16rpx;
  text-align: center;
  font-size: 26rpx;
  color: $ink-2;
  &.on {
    background: $card;
    color: $ink;
    font-weight: 700;
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 34rpx;
      bottom: 34rpx;
      width: 8rpx;
      border-radius: 0 8rpx 8rpx 0;
      background: $primary;
    }
  }
}
.cat-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: $accent;
  color: #fff;
  font-size: 20rpx;
  line-height: 30rpx;
}
.main {
  flex: 1;
  height: 100%;
  padding: 0 24rpx;
}
.cat-title {
  font-size: 28rpx;
  font-weight: 700;
  padding: 20rpx 4rpx 16rpx;
}
.item {
  display: flex;
  padding: 18rpx;
  margin-bottom: 18rpx;
  border-radius: $radius;
}
.item.off {
  opacity: 0.7;
}
.img-wrap {
  position: relative;
  width: 172rpx;
  height: 172rpx;
  flex-shrink: 0;
  border-radius: 20rpx;
  overflow: hidden;
  background: $card-2;
}
.img {
  width: 172rpx;
  height: 172rpx;
}
.img-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  font-size: 22rpx;
  color: #fff;
  background: rgba(31, 42, 55, 0.55);
}
.info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.name {
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $ink-2;
}
.tags {
  margin-top: 8rpx;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8rpx;
  font-size: 20rpx;
}
.tag-off {
  color: $primary-dark;
  border: 1rpx solid $primary;
  border-radius: 6rpx;
  padding: 0 6rpx;
}
.tag-split {
  color: #fff;
  background: $mint;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.sales {
  color: $ink-3;
}
.foot {
  padding-top: 10rpx;
}
.spec-btn {
  position: relative;
  height: 52rpx;
  line-height: 52rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: $primary;
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}
.spec-num {
  position: absolute;
  top: -14rpx;
  right: -10rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: $mint;
  font-size: 20rpx;
  text-align: center;
}
.foot {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .price {
    font-size: 34rpx;
  }
  .unit {
    font-size: 22rpx;
    color: $ink-3;
  }
  .origin {
    margin-left: 8rpx;
    font-size: 22rpx;
    color: $ink-3;
    text-decoration: line-through;
  }
}
.sold-out {
  font-size: 24rpx;
  color: $ink-3;
}
.bar {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(var(--window-bottom, 0px) + 24rpx);
  height: 108rpx;
  border-radius: 999rpx;
  background: $primary;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10rpx 0 28rpx;
  box-shadow: 0 16rpx 40rpx rgba(31, 42, 55, 0.25);
  z-index: 10;
}
.bar-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  color: #fff;
}
.bag {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: $card;
  display: flex;
  align-items: center;
  justify-content: center;
  .bag-icon {
    width: 40rpx;
    height: 40rpx;
  }
  .bag-num {
    position: absolute;
    top: -8rpx;
    right: -10rpx;
    min-width: 34rpx;
    height: 34rpx;
    border-radius: 999rpx;
    background: $accent;
    color: #fff;
    font-size: 20rpx;
    text-align: center;
    line-height: 34rpx;
    padding: 0 8rpx;
  }
}
.bar-total {
  font-size: 34rpx;
  font-weight: 700;
}
.bar-tip {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.85);
}
.bar-btn {
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 48rpx;
  border-radius: 999rpx;
  background: $card;
  color: $ink;
  font-weight: 700;
  font-size: 30rpx;
  &.disabled {
    padding: 0 32rpx;
    font-size: 26rpx;
    background: rgba(255, 255, 255, 0.55);
    color: $ink-2;
  }
}
</style>
