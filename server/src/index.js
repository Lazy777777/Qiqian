const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const store = require('./db')
const { seed } = require('./seed')
const payment = require('./payment')

const PORT = Number(process.env.PORT || 3000)
const MERCHANT_PASSWORD = process.env.MERCHANT_PASSWORD || 'admin123'
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')

seed()
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const DELIVERY_FEE = 300
const FREE_DELIVERY_THRESHOLD = 3900
const RECHARGE_PLANS = [
  { amount: 5000, bonus: 0 },
  { amount: 10000, bonus: 1000 },
  { amount: 20000, bonus: 3000 },
  { amount: 50000, bonus: 10000 }
]
const VIP_LEVELS = [
  { level: 0, name: '普通会员', min: 0, discount: 1, freeDelivery: false, perks: '消费积分' },
  { level: 1, name: '银卡会员', min: 20000, discount: 1, freeDelivery: true, perks: '积分 · 免配送费' },
  { level: 2, name: '金卡会员', min: 50000, discount: 0.95, freeDelivery: true, perks: '积分 · 免配送费 · 95折' }
]
const ORDER_STATUS = {
  unpaid: '待付款',
  pending: '待接单',
  preparing: '备货中',
  delivering: '配送中',
  completed: '已完成',
  refunded: '已退款',
  cancelled: '已取消'
}
const MERCHANT_SETTABLE = ['pending', 'preparing', 'delivering', 'completed']

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1h' }))

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
const wrap = (fn) => (req, res, next) => {
  try {
    const out = fn(req, res)
    if (out !== undefined) res.json({ ok: true, data: out })
  } catch (e) {
    next(e)
  }
}

function vipOf(user) {
  return [...VIP_LEVELS].reverse().find((v) => user.totalRecharge >= v.min)
}
function publicUser(user) {
  const vip = vipOf(user)
  const next = VIP_LEVELS.find((v) => v.min > user.totalRecharge)
  return { ...user, vip, nextVip: next ? { name: next.name, need: next.min - user.totalRecharge } : null }
}
function orderNo() {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  const s = d.toISOString().replace(/\D/g, '').slice(0, 14)
  return s + String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}
function decorate(order) {
  return { ...order, statusText: ORDER_STATUS[order.status] }
}
function addBalanceLog(user, change, type, remark) {
  user.balance += change
  store.db.balanceLogs.push({
    id: store.id('bl_'),
    userId: user.id,
    change,
    balance: user.balance,
    type,
    remark,
    createdAt: Date.now()
  })
}

// ---------- 用户 ----------
function requireUser(req) {
  const uid = req.get('X-User-Id')
  const user = store.db.users.find((u) => u.id === uid)
  if (!user) throw new HttpError(401, '请先登录')
  return user
}

// 预留：小程序可传 uni.login 的 code，后端调用 jscode2session 换取 openid
app.post('/api/user/login', wrap((req) => {
  const { deviceId, nickname } = req.body || {}
  if (!deviceId) throw new HttpError(400, '缺少设备标识')
  let user = store.db.users.find((u) => u.deviceId === deviceId)
  if (!user) {
    user = {
      id: store.id('u_'),
      deviceId,
      nickname: nickname || '百货会员' + String(store.db.users.length + 1).padStart(3, '0'),
      balance: 0,
      points: 0,
      totalRecharge: 0,
      createdAt: Date.now()
    }
    store.db.users.push(user)
    store.save()
  }
  return publicUser(user)
}))

app.get('/api/user/me', wrap((req) => publicUser(requireUser(req))))

app.get('/api/user/balance-logs', wrap((req) => {
  const user = requireUser(req)
  return store.db.balanceLogs.filter((l) => l.userId === user.id).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50)
}))

// ---------- 菜单 ----------
app.get('/api/menu', wrap(() => {
  const { categories, products } = store.db
  return {
    categories: [...categories].sort((a, b) => a.sort - b.sort),
    products: products.filter((p) => p.onSale)
  }
}))

app.get('/api/config', wrap(() => ({
  deliveryFee: DELIVERY_FEE,
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  rechargePlans: RECHARGE_PLANS,
  vipLevels: VIP_LEVELS,
  payMode: payment.PAY_MODE
})))

// ---------- 地址 ----------
function validAddress(body) {
  const { name, phone, region, detail } = body || {}
  if (!name || !String(name).trim()) throw new HttpError(400, '请填写收货人')
  if (!/^1\d{10}$/.test(String(phone || ''))) throw new HttpError(400, '请填写正确的 11 位手机号')
  if (!detail || !String(detail).trim()) throw new HttpError(400, '请填写详细地址')
  return {
    name: String(name).trim(),
    phone: String(phone),
    region: String(region || '').trim(),
    detail: String(detail).trim(),
    tag: body.tag || ''
  }
}
function setDefault(userId, addrId) {
  store.db.addresses.forEach((a) => {
    if (a.userId === userId) a.isDefault = a.id === addrId
  })
}

app.get('/api/addresses', wrap((req) => {
  const user = requireUser(req)
  return store.db.addresses
    .filter((a) => a.userId === user.id)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt - a.createdAt)
}))

app.post('/api/addresses', wrap((req) => {
  const user = requireUser(req)
  const data = validAddress(req.body)
  const mine = store.db.addresses.filter((a) => a.userId === user.id)
  const addr = { id: store.id('a_'), userId: user.id, ...data, isDefault: false, createdAt: Date.now() }
  store.db.addresses.push(addr)
  if (req.body.isDefault || mine.length === 0) setDefault(user.id, addr.id)
  store.save()
  return addr
}))

app.put('/api/addresses/:id', wrap((req) => {
  const user = requireUser(req)
  const addr = store.db.addresses.find((a) => a.id === req.params.id && a.userId === user.id)
  if (!addr) throw new HttpError(404, '地址不存在')
  Object.assign(addr, validAddress(req.body))
  if (req.body.isDefault) setDefault(user.id, addr.id)
  store.save()
  return addr
}))

app.delete('/api/addresses/:id', wrap((req) => {
  const user = requireUser(req)
  const idx = store.db.addresses.findIndex((a) => a.id === req.params.id && a.userId === user.id)
  if (idx < 0) throw new HttpError(404, '地址不存在')
  const [removed] = store.db.addresses.splice(idx, 1)
  if (removed.isDefault) {
    const next = store.db.addresses.find((a) => a.userId === user.id)
    if (next) next.isDefault = true
  }
  store.save()
  return true
}))

// ---------- 订单 ----------
function priceOrder(user, items) {
  const { products } = store.db
  const lines = (items || []).map(({ productId, qty }) => {
    const p = products.find((x) => x.id === productId)
    if (!p || !p.onSale) throw new HttpError(400, '部分商品已下架，请刷新后重试')
    const n = Math.max(1, Math.floor(Number(qty) || 0))
    if (n > p.stock) throw new HttpError(400, `${p.name} 库存不足`)
    return { productId: p.id, name: p.name, price: p.price, unit: p.unit, image: p.image, qty: n }
  })
  if (!lines.length) throw new HttpError(400, '购物车是空的')
  const vip = vipOf(user)
  const goodsAmount = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const discount = Math.round(goodsAmount * (1 - vip.discount))
  const deliveryFee = vip.freeDelivery || goodsAmount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  return { lines, goodsAmount, discount, deliveryFee, payAmount: goodsAmount - discount + deliveryFee }
}

app.post('/api/orders/preview', wrap((req) => {
  const user = requireUser(req)
  const { lines, ...rest } = priceOrder(user, req.body.items)
  return { items: lines, ...rest, vip: vipOf(user) }
}))

app.post('/api/orders', wrap((req) => {
  const user = requireUser(req)
  const { items, addressId, remark } = req.body || {}
  const priced = priceOrder(user, items)
  const a = store.db.addresses.find((x) => x.id === addressId && x.userId === user.id)
  if (!a) throw new HttpError(400, '请选择收货地址')
  const address = { name: a.name, phone: a.phone, region: a.region, detail: a.detail }
  const now = Date.now()
  const order = {
    id: store.id('o_'),
    orderNo: orderNo(),
    userId: user.id,
    items: priced.lines,
    goodsAmount: priced.goodsAmount,
    discount: priced.discount,
    deliveryFee: priced.deliveryFee,
    payAmount: priced.payAmount,
    address,
    remark: String(remark || '').slice(0, 100),
    status: 'unpaid',
    payMethod: null,
    merchantSeen: false,
    timeline: [{ status: 'unpaid', at: now }],
    createdAt: now,
    updatedAt: now
  }
  store.db.orders.push(order)
  store.save()
  return decorate(order)
}))

app.get('/api/orders', wrap((req) => {
  const user = requireUser(req)
  const { status } = req.query
  return store.db.orders
    .filter((o) => o.userId === user.id && (!status || status === 'all' || o.status === status))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(decorate)
}))

app.get('/api/orders/:id', wrap((req) => {
  const user = requireUser(req)
  const o = store.db.orders.find((x) => x.id === req.params.id && x.userId === user.id)
  if (!o) throw new HttpError(404, '订单不存在')
  return decorate(o)
}))

function setStatus(order, status) {
  order.status = status
  order.updatedAt = Date.now()
  order.timeline.push({ status, at: order.updatedAt })
}

function markOrderPaid(order, method) {
  for (const l of order.items) {
    const p = store.db.products.find((x) => x.id === l.productId)
    if (p) {
      p.stock = Math.max(0, p.stock - l.qty)
      p.sales += l.qty
    }
  }
  const user = store.db.users.find((u) => u.id === order.userId)
  user.points += Math.floor(order.payAmount / 100)
  order.payMethod = method
  order.paidAt = Date.now()
  order.merchantSeen = false
  setStatus(order, 'pending')
}

app.post('/api/orders/:id/cancel', wrap((req) => {
  const user = requireUser(req)
  const o = store.db.orders.find((x) => x.id === req.params.id && x.userId === user.id)
  if (!o) throw new HttpError(404, '订单不存在')
  if (o.status !== 'unpaid') throw new HttpError(400, '仅待付款订单可取消')
  setStatus(o, 'cancelled')
  store.save()
  return decorate(o)
}))

app.post('/api/orders/:id/pay', wrap((req) => {
  const user = requireUser(req)
  const o = store.db.orders.find((x) => x.id === req.params.id && x.userId === user.id)
  if (!o) throw new HttpError(404, '订单不存在')
  if (o.status !== 'unpaid') throw new HttpError(400, '订单已支付或已关闭')
  const { method } = req.body || {}
  if (method === 'balance') {
    if (user.balance < o.payAmount) throw new HttpError(400, '余额不足，请先充值')
    addBalanceLog(user, -o.payAmount, 'pay', `订单 ${o.orderNo}`)
    markOrderPaid(o, 'balance')
    store.save()
    return { paid: true, order: decorate(o), user: publicUser(user) }
  }
  if (method === 'wechat') {
    const prepay = payment.createWechatPrepay({
      userId: user.id,
      bizType: 'order',
      bizId: o.id,
      amount: o.payAmount,
      description: `订单 ${o.orderNo}`
    })
    return { paid: false, prepay }
  }
  throw new HttpError(400, '不支持的支付方式')
}))

// ---------- 充值 ----------
app.post('/api/recharge', wrap((req) => {
  const user = requireUser(req)
  const plan = RECHARGE_PLANS.find((p) => p.amount === Number(req.body.amount))
  if (!plan) throw new HttpError(400, '请选择充值金额')
  const rec = {
    id: store.id('r_'),
    userId: user.id,
    amount: plan.amount,
    bonus: plan.bonus,
    status: 'pending',
    createdAt: Date.now()
  }
  store.db.recharges.push(rec)
  const prepay = payment.createWechatPrepay({
    userId: user.id,
    bizType: 'recharge',
    bizId: rec.id,
    amount: plan.amount,
    description: `会员卡充值 ¥${plan.amount / 100}`
  })
  return { recharge: rec, prepay }
}))

// ---------- 支付确认（模拟微信支付回调） ----------
function completePayment(pay) {
  if (pay.status === 'paid') return
  pay.status = 'paid'
  pay.paidAt = Date.now()
  const user = store.db.users.find((u) => u.id === pay.userId)
  if (pay.bizType === 'order') {
    const o = store.db.orders.find((x) => x.id === pay.bizId)
    if (o && o.status === 'unpaid') markOrderPaid(o, 'wechat')
  } else if (pay.bizType === 'recharge') {
    const rec = store.db.recharges.find((x) => x.id === pay.bizId)
    if (rec && rec.status === 'pending') {
      rec.status = 'paid'
      user.totalRecharge += rec.amount
      addBalanceLog(user, rec.amount + rec.bonus, 'recharge', rec.bonus ? `充值 ¥${rec.amount / 100}（赠 ¥${rec.bonus / 100}）` : `充值 ¥${rec.amount / 100}`)
    }
  }
}

app.post('/api/pay/mock-confirm', wrap((req) => {
  if (payment.PAY_MODE !== 'mock') throw new HttpError(403, '非模拟支付模式')
  const user = requireUser(req)
  const pay = store.db.payments.find((p) => p.id === req.body.paymentId && p.userId === user.id)
  if (!pay) throw new HttpError(404, '支付单不存在')
  completePayment(pay)
  store.save()
  const out = { payment: pay, user: publicUser(user) }
  if (pay.bizType === 'order') out.order = decorate(store.db.orders.find((x) => x.id === pay.bizId))
  return out
}))

// 预留：真实微信支付结果通知（需验签 + 解密 resource 后调用 completePayment）
app.post('/api/pay/wechat-notify', (req, res) => {
  res.status(501).json({ code: 'NOT_IMPLEMENTED', message: '尚未配置微信支付商户号' })
})

// ---------- 商家端 ----------
app.post('/api/merchant/login', wrap((req) => {
  if (String((req.body || {}).password || '') !== MERCHANT_PASSWORD) throw new HttpError(401, '密码错误')
  const token = crypto.randomBytes(16).toString('hex')
  store.db.merchantSessions.push({ token, createdAt: Date.now() })
  store.db.merchantSessions = store.db.merchantSessions.slice(-20)
  store.save()
  return { token }
}))

function requireMerchant(req, res, next) {
  const token = req.get('X-Merchant-Token')
  if (!token || !store.db.merchantSessions.some((s) => s.token === token)) {
    return res.status(401).json({ ok: false, message: '请先登录商家后台' })
  }
  next()
}
app.use('/api/merchant', requireMerchant)

function merchantOrder(o) {
  const user = store.db.users.find((u) => u.id === o.userId)
  return { ...decorate(o), userNickname: user ? user.nickname : '' }
}

app.get('/api/merchant/summary', wrap(() => {
  const paid = store.db.orders.filter((o) => o.status !== 'unpaid' && o.status !== 'cancelled')
  const startOfDay = new Date(Date.now() + 8 * 3600e3)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const today = paid.filter((o) => o.paidAt >= startOfDay.getTime() - 8 * 3600e3)
  return {
    newCount: paid.filter((o) => !o.merchantSeen && o.status === 'pending').length,
    pending: paid.filter((o) => o.status === 'pending').length,
    processing: paid.filter((o) => o.status === 'preparing' || o.status === 'delivering').length,
    todayCount: today.filter((o) => o.status !== 'refunded').length,
    todayAmount: today.filter((o) => o.status !== 'refunded').reduce((s, o) => s + o.payAmount, 0)
  }
}))

app.get('/api/merchant/orders', wrap((req) => {
  const { status } = req.query
  return store.db.orders
    .filter((o) => o.status !== 'unpaid' && o.status !== 'cancelled')
    .filter((o) => {
      if (!status || status === 'all') return true
      if (status === 'processing') return o.status === 'preparing' || o.status === 'delivering'
      return o.status === status
    })
    .sort((a, b) => Number(a.merchantSeen) - Number(b.merchantSeen) || b.paidAt - a.paidAt)
    .map(merchantOrder)
}))

app.get('/api/merchant/orders/:id', wrap((req) => {
  const o = store.db.orders.find((x) => x.id === req.params.id)
  if (!o) throw new HttpError(404, '订单不存在')
  if (!o.merchantSeen) {
    o.merchantSeen = true
    store.save()
  }
  return merchantOrder(o)
}))

app.post('/api/merchant/orders/:id/status', wrap((req) => {
  const o = store.db.orders.find((x) => x.id === req.params.id)
  if (!o) throw new HttpError(404, '订单不存在')
  const { status } = req.body || {}
  if (!MERCHANT_SETTABLE.includes(status)) throw new HttpError(400, '无效的订单状态')
  if (['unpaid', 'cancelled', 'refunded'].includes(o.status)) throw new HttpError(400, '该订单状态不可修改')
  o.merchantSeen = true
  setStatus(o, status)
  store.save()
  return merchantOrder(o)
}))

app.post('/api/merchant/orders/:id/refund', wrap((req) => {
  const o = store.db.orders.find((x) => x.id === req.params.id)
  if (!o) throw new HttpError(404, '订单不存在')
  if (['unpaid', 'cancelled', 'refunded'].includes(o.status)) throw new HttpError(400, '该订单不可退款')
  const user = store.db.users.find((u) => u.id === o.userId)
  addBalanceLog(user, o.payAmount, 'refund', `订单 ${o.orderNo} 退款`)
  user.points = Math.max(0, user.points - Math.floor(o.payAmount / 100))
  for (const l of o.items) {
    const p = store.db.products.find((x) => x.id === l.productId)
    if (p) p.stock += l.qty
  }
  o.refundReason = String((req.body || {}).reason || '商家退款').slice(0, 100)
  o.refundedAt = Date.now()
  o.merchantSeen = true
  setStatus(o, 'refunded')
  store.save()
  return merchantOrder(o)
}))

// 商品管理
app.get('/api/merchant/products', wrap(() => ({
  categories: [...store.db.categories].sort((a, b) => a.sort - b.sort),
  products: store.db.products
})))

function validProduct(body) {
  const name = String(body.name || '').trim()
  if (!name) throw new HttpError(400, '请填写商品名称')
  const price = Math.round(Number(body.price))
  if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, '请填写正确的价格')
  if (!store.db.categories.some((c) => c.id === body.categoryId)) throw new HttpError(400, '请选择分类')
  const originalPrice = body.originalPrice ? Math.round(Number(body.originalPrice)) : null
  return {
    name,
    categoryId: body.categoryId,
    desc: String(body.desc || '').trim(),
    price,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : null,
    unit: String(body.unit || '份').trim() || '份',
    image: String(body.image || ''),
    stock: Math.max(0, Math.floor(Number(body.stock ?? 99))),
    onSale: body.onSale !== false
  }
}

app.post('/api/merchant/products', wrap((req) => {
  const p = { id: store.id('p_'), ...validProduct(req.body || {}), sales: 0, createdAt: Date.now() }
  store.db.products.unshift(p)
  store.save()
  return p
}))

app.put('/api/merchant/products/:id', wrap((req) => {
  const p = store.db.products.find((x) => x.id === req.params.id)
  if (!p) throw new HttpError(404, '商品不存在')
  Object.assign(p, validProduct({ ...p, ...req.body }))
  store.save()
  return p
}))

app.delete('/api/merchant/products/:id', wrap((req) => {
  const idx = store.db.products.findIndex((x) => x.id === req.params.id)
  if (idx < 0) throw new HttpError(404, '商品不存在')
  store.db.products.splice(idx, 1)
  store.save()
  return true
}))

app.post('/api/merchant/categories', wrap((req) => {
  const name = String((req.body || {}).name || '').trim()
  if (!name) throw new HttpError(400, '请填写分类名称')
  const c = { id: store.id('c_'), name, sort: store.db.categories.length + 1 }
  store.db.categories.push(c)
  store.save()
  return c
}))

app.delete('/api/merchant/categories/:id', wrap((req) => {
  if (store.db.products.some((p) => p.categoryId === req.params.id)) throw new HttpError(400, '分类下还有商品，不能删除')
  store.db.categories = store.db.categories.filter((c) => c.id !== req.params.id)
  store.save()
  return true
}))

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase()
      cb(null, store.id('img_') + ext)
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype) || /\.(jpe?g|png|gif|webp)$/i.test(file.originalname))
})
app.post('/api/merchant/upload', upload.single('file'), wrap((req) => {
  if (!req.file) throw new HttpError(400, '请选择图片')
  return { url: `/uploads/${req.file.filename}` }
}))

// H5 生产构建可直接由后端托管
const H5_DIST = path.join(__dirname, '..', '..', 'client', 'dist', 'build', 'h5')
if (fs.existsSync(H5_DIST)) app.use(express.static(H5_DIST))

app.use((err, req, res, next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 400 : 500)
  if (status >= 500) console.error(err)
  res.status(status).json({ ok: false, message: err.code === 'LIMIT_FILE_SIZE' ? '图片不能超过 5MB' : err.message })
})

app.listen(PORT, () => {
  console.log(`百货小程序后端已启动：http://localhost:${PORT}`)
  console.log(`商家后台密码：${MERCHANT_PASSWORD === 'admin123' ? 'admin123（默认，可用 MERCHANT_PASSWORD 修改）' : '已通过环境变量设置'}`)
})
