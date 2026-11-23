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
const CART_KEY = 'cart_v1'
export const cart = reactive({
  items: uni.getStorageSync(CART_KEY) || [],
  deliveryType: 'delivery'
})

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

export const cartCount = computed(() => cart.items.reduce((s, i) => s + i.qty, 0))
export const cartTotal = computed(() =>
  cart.items.filter((i) => i.checked).reduce((s, i) => s + i.price * i.qty, 0)
)
export const checkedItems = computed(() => cart.items.filter((i) => i.checked))

export function qtyOf(productId) {
  const it = cart.items.find((i) => i.productId === productId)
  return it ? it.qty : 0
}

export function addToCart(p, delta = 1) {
  const it = cart.items.find((i) => i.productId === p.id)
  if (it) {
    it.qty += delta
    if (it.qty <= 0) cart.items.splice(cart.items.indexOf(it), 1)
  } else if (delta > 0) {
    cart.items.push({
      productId: p.id,
      name: p.name,
      price: p.price,
      unit: p.unit,
      image: p.image,
      desc: p.desc,
      qty: delta,
      checked: true
    })
  }
  persist()
}

export function setQty(productId, qty) {
  const it = cart.items.find((i) => i.productId === productId)
  if (!it) return
  if (qty <= 0) cart.items.splice(cart.items.indexOf(it), 1)
  else it.qty = qty
  persist()
}

export function toggleChecked(productId) {
  const it = cart.items.find((i) => i.productId === productId)
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

// 同步最新价格/下架状态
export function syncCartWithMenu(products) {
  const map = Object.fromEntries(products.map((p) => [p.id, p]))
  cart.items = cart.items
    .filter((i) => map[i.productId])
    .map((i) => ({ ...i, price: map[i.productId].price, name: map[i.productId].name, image: map[i.productId].image }))
  persist()
}

// 结算时选中的地址（地址页选择后回填）
export const checkoutState = reactive({ addressId: '', buyNow: null })
