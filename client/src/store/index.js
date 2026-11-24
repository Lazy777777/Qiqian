import { reactive, computed } from 'vue'
import { api, getDeviceId, setUserId } from '../utils/request'

// ---------- 用户 ----------
export const userState = reactive({ user: null, config: null })

let loginTask = null
export function ensureLogin(force = false) {
  if (userState.user && !force) return Promise.resolve(userState.user)
  if (!loginTask || force) {
    // 预留：小程序可先 uni.login 拿 code 一起提交，换取 openid
    loginTask = api
      .post('/api/user/login', { deviceId: getDeviceId() }, { silent: true })
      .then((u) => {
        setUserId(u.id)
        userState.user = u
        return u
      })
      .finally(() => {
        loginTask = null
      })
  }
  return loginTask
}

export async function refreshUser() {
  await ensureLogin()
  userState.user = await api.get('/api/user/me', { silent: true })
  return userState.user
}

export async function loadConfig() {
  if (!userState.config) userState.config = await api.get('/api/config', { silent: true })
  return userState.config
}

// ---------- 购物车 ----------
// 每行按「商品 + 规格」区分，spec 为 whole（整件）或 single（单包）
const CART_KEY = 'cart_v2'
export const cart = reactive({
  items: uni.getStorageSync(CART_KEY) || []
})

// 首页入口跳到选购页时指定分类（tabBar 页面无法带参数）
export const menuState = reactive({ category: '' })

function persist() {
  uni.setStorageSync(CART_KEY, cart.items)
  syncBadge()
}

export function syncBadge() {
  const n = cart.items.reduce((s, i) => s + i.qty, 0)
  const opt = { index: 2 }
  if (n > 0) uni.setTabBarBadge({ ...opt, text: String(n > 99 ? '99+' : n), fail() {} })
  else uni.removeTabBarBadge({ ...opt, fail() {} })
}

export const lineKey = (productId, spec = 'whole') => `${productId}:${spec}`

export const cartCount = computed(() => cart.items.reduce((s, i) => s + i.qty, 0))
export const cartTotal = computed(() =>
  cart.items.filter((i) => i.checked).reduce((s, i) => s + i.price * i.qty, 0)
)
export const checkedItems = computed(() => cart.items.filter((i) => i.checked))
// 商品金额（不含配送费、会员折扣前）未达到起送价时还差多少
export const shortOfMin = computed(() => {
  const min = userState.config ? userState.config.minOrderAmount || 0 : 0
  return Math.max(0, min - cartTotal.value)
})

export function qtyOf(productId, spec) {
  return cart.items
    .filter((i) => i.productId === productId && (!spec || i.spec === spec))
    .reduce((s, i) => s + i.qty, 0)
}

// 整件 + 单包合计折算成单包数，用于前端库存提示
export function canAdd(p, spec = 'whole') {
  const whole = qtyOf(p.id, 'whole')
  const single = qtyOf(p.id, 'single')
  if (spec === 'single') return whole * p.packCount + single + 1 <= p.singleAvailable
  if (whole + 1 > p.stock) return false
  return !single || (whole + 1) * p.packCount + single <= p.singleAvailable
}

export function specOf(p, specId = 'whole') {
  const s = (p.specs || []).find((x) => x.id === specId)
  return s || { id: 'whole', name: '', price: p.price, unit: p.unit }
}

export function addToCart(p, delta = 1, specId = 'whole') {
  const spec = specOf(p, specId)
  const key = lineKey(p.id, spec.id)
  const it = cart.items.find((i) => i.key === key)
  if (it) {
    it.qty += delta
    if (it.qty <= 0) cart.items.splice(cart.items.indexOf(it), 1)
  } else if (delta > 0) {
    cart.items.push({
      key,
      productId: p.id,
      spec: spec.id,
      specName: spec.name,
      name: p.name,
      price: spec.price,
      unit: spec.unit,
      image: p.image,
      desc: p.desc,
      qty: delta,
      checked: true
    })
  }
  persist()
}

export function setQty(key, qty) {
  const it = cart.items.find((i) => i.key === key)
  if (!it) return
  if (qty <= 0) cart.items.splice(cart.items.indexOf(it), 1)
  else it.qty = qty
  persist()
}

export function toggleChecked(key) {
  const it = cart.items.find((i) => i.key === key)
  if (it) it.checked = !it.checked
  persist()
}

export function toggleAll(v) {
  cart.items.forEach((i) => (i.checked = v))
  persist()
}

export function removeChecked() {
  cart.items = cart.items.filter((i) => !i.checked)
  persist()
}

// 同步最新价格 / 规格 / 下架状态
export function syncCartWithMenu(products) {
  const map = Object.fromEntries(products.map((p) => [p.id, p]))
  cart.items = cart.items
    .filter((i) => map[i.productId] && (i.spec === 'whole' || (map[i.productId].specs || []).some((s) => s.id === i.spec)))
    .map((i) => {
      const p = map[i.productId]
      const s = specOf(p, i.spec)
      return { ...i, price: s.price, unit: s.unit, specName: s.name, name: p.name, image: p.image }
    })
  persist()
}

// 结算时选中的地址（地址页选择后回填）
export const checkoutState = reactive({ addressId: '', buyNow: null })
