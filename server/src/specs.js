// 整件 / 单包 规格。价格单位：分
// 拆包定价规则：整件价 ÷ 件数，不到 1 元按 1 元/包，超过 1 元按 2 元/包
function ruleSinglePrice(price, packCount) {
  if (!(packCount > 1) || !(price > 0)) return null
  return price / packCount <= 100 ? 100 : 200
}

function isSplittable(p) {
  return p.packCount > 1 && p.singlePrice > 0
}

function specsOf(p) {
  if (!isSplittable(p)) return []
  const u = p.singleUnit || '包'
  return [
    { id: 'whole', name: `整件（${p.packCount}${u}）`, price: p.price, unit: p.unit },
    { id: 'single', name: `单${u}`, price: p.singlePrice, unit: u }
  ]
}

// 可售的单包总数：整件可拆 + 已拆开剩余的散包
function singleAvailable(p) {
  return p.stock * p.packCount + (p.looseStock || 0)
}

function specOf(p, specId) {
  if (!isSplittable(p)) {
    if (specId && specId !== 'whole') return null
    return { id: 'whole', name: '', price: p.price, unit: p.unit }
  }
  return specsOf(p).find((s) => s.id === (specId || 'whole')) || null
}

// 同一商品多行（整件 + 单包）一起校验库存
function checkStock(p, wholeQty, singleQty) {
  if (wholeQty > p.stock) return false
  if (!singleQty) return true
  return wholeQty * p.packCount + singleQty <= singleAvailable(p)
}

function consume(p, specId, qty) {
  if (specId !== 'single') {
    p.stock = Math.max(0, p.stock - qty)
    return
  }
  let loose = p.looseStock || 0
  if (loose < qty) {
    const open = Math.ceil((qty - loose) / p.packCount)
    p.stock = Math.max(0, p.stock - open)
    loose += open * p.packCount
  }
  p.looseStock = loose - qty
}

function restore(p, specId, qty) {
  if (specId === 'single') p.looseStock = (p.looseStock || 0) + qty
  else p.stock += qty
}

module.exports = { ruleSinglePrice, isSplittable, specsOf, specOf, singleAvailable, checkStock, consume, restore }
