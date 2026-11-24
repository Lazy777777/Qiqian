<template>
  <view v-if="product" class="mask" @click="close" @touchmove.stop.prevent>
    <view class="sheet safe-bottom" @click.stop>
      <text class="close" @click="close">✕</text>
      <scroll-view scroll-y class="body">
        <image class="img" :src="imgUrl(product.image)" mode="aspectFit" />
        <view class="name">{{ product.name }}</view>
        <view class="price-row">
          <text class="price"><text class="sym">¥</text>{{ yuan(spec.price) }}</text>
          <text class="unit">/{{ spec.unit }}</text>
          <text v-if="spec.id === 'whole' && product.originalPrice" class="origin">¥{{ yuan(product.originalPrice) }}</text>
          <text v-if="spec.id === 'whole' && discountText(product)" class="off">{{ discountText(product) }}</text>
        </view>

        <view v-if="product.specs && product.specs.length" class="block">
          <view class="label">规格</view>
          <view class="specs">
            <view
              v-for="s in product.specs"
              :key="s.id"
              :class="['spec', specId === s.id && 'on']"
              @click="specId = s.id"
            >{{ s.name }} ¥{{ yuan(s.price) }}</view>
          </view>
          <view class="hint">整件 ¥{{ yuan(product.price) }} 共 {{ product.packCount }}{{ product.singleUnit }}，可拆开按单{{ product.singleUnit }}购买</view>
        </view>

        <view class="block">
          <view class="label">商品详情</view>
          <view class="detail">{{ product.desc }}</view>
          <view v-if="product.detail" class="detail">{{ product.detail }}</view>
          <view v-if="/备注/.test(product.name)" class="detail warn">该商品需要备注口味，请在结算页「订单备注」中填写</view>
        </view>
      </scroll-view>

      <view class="foot">
        <text class="stock">{{ stockText }}</text>
        <text v-if="soldOut" class="sold-out">已售罄</text>
        <qty-stepper v-else-if="inCart > 0" :value="inCart" @change="change" />
        <view v-else class="btn-black add" @click="change(1)">加入购物车</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { imgUrl } from '../../utils/request'
import { yuan, discountText } from '../../utils/format'
import { addToCart, qtyOf, canAdd, specOf } from '../../store'

const props = defineProps({ product: { type: Object, default: null } })
const emit = defineEmits(['close'])

const specId = ref('whole')
watch(
  () => props.product && props.product.id,
  () => (specId.value = 'whole')
)

const spec = computed(() => specOf(props.product, specId.value))
const inCart = computed(() => qtyOf(props.product.id, spec.value.id))
const soldOut = computed(() => {
  const p = props.product
  return spec.value.id === 'single' ? p.singleAvailable <= 0 : p.stock <= 0
})
const stockText = computed(() => {
  const p = props.product
  if (spec.value.id === 'single') return `可售 ${p.singleAvailable} ${p.singleUnit}`
  return `库存 ${p.stock}`
})

function change(d) {
  if (d > 0 && !canAdd(props.product, spec.value.id)) return uni.showToast({ title: '库存不足', icon: 'none' })
  addToCart(props.product, d, spec.value.id)
}
const close = () => emit('close')
</script>

<style lang="scss" scoped>
.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: var(--window-bottom, 0px);
  z-index: 998;
  background: rgba(31, 42, 55, 0.45);
  display: flex;
  align-items: flex-end;
}
.sheet {
  position: relative;
  width: 100%;
  background: $card;
  border-radius: 36rpx 36rpx 0 0;
  padding: 28rpx 32rpx 24rpx;
}
.close {
  position: absolute;
  right: 28rpx;
  top: 20rpx;
  z-index: 2;
  width: 56rpx;
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: $ink-2;
}
.body {
  max-height: 62vh;
}
.img {
  width: 100%;
  height: 520rpx;
  border-radius: 24rpx;
  background: $card-2;
}
.name {
  margin-top: 20rpx;
  font-size: 34rpx;
  font-weight: 700;
}
.price-row {
  margin-top: 12rpx;
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  .price {
    font-size: 44rpx;
    color: $primary-dark;
  }
  .unit {
    font-size: 24rpx;
    color: $ink-3;
  }
  .origin {
    font-size: 24rpx;
    color: $ink-3;
    text-decoration: line-through;
  }
  .off {
    font-size: 22rpx;
    color: $primary-dark;
    border: 1rpx solid $primary;
    border-radius: 8rpx;
    padding: 0 8rpx;
  }
}
.block {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid $line;
}
.label {
  font-weight: 700;
  font-size: 28rpx;
  margin-bottom: 14rpx;
}
.specs {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.spec {
  padding: 14rpx 26rpx;
  border-radius: 999rpx;
  background: $card-2;
  border: 2rpx solid transparent;
  font-size: 26rpx;
  &.on {
    background: $primary-light;
    border-color: $primary;
    color: $primary-dark;
    font-weight: 600;
  }
}
.hint {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: $ink-3;
}
.detail {
  font-size: 26rpx;
  color: $ink-2;
  line-height: 1.6;
  &.warn {
    margin-top: 8rpx;
    color: $primary-dark;
  }
}
.foot {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 84rpx;
}
.stock {
  font-size: 24rpx;
  color: $ink-3;
}
.sold-out {
  color: $ink-3;
}
.add {
  width: 300rpx;
}
</style>
