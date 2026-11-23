export const yuan = (fen) => {
  const v = (Number(fen) || 0) / 100
  return Number.isInteger(v) ? String(v) : v.toFixed(2)
}

export const money = (fen) => ((Number(fen) || 0) / 100).toFixed(2)

const pad = (n) => String(n).padStart(2, '0')
export function dateTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export function shortTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay ? `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}` : `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const STATUS = {
  unpaid: { text: '待付款', color: '#c0583c', desc: '请尽快完成支付' },
  pending: { text: '待接单', color: '#c8875a', desc: '商家正在确认您的订单' },
  preparing: { text: '备货中', color: '#a8693f', desc: '商家正在为您打包商品' },
  delivering: { text: '配送中', color: '#4f7fa8', desc: '骑手正在火速赶来' },
  completed: { text: '已完成', color: '#6f8f5a', desc: '感谢光临，欢迎再来' },
  refunded: { text: '已退款', color: '#8c8279', desc: '款项已退回会员余额' },
  cancelled: { text: '已取消', color: '#8c8279', desc: '订单已取消' }
}

export const maskPhone = (p) => (p ? String(p).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : '')
