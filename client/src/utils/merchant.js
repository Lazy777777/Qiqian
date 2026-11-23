import { api } from './request'

export const NEXT_ACTION = {
  pending: { status: 'preparing', text: '接单' },
  preparing: { status: 'delivering', text: '开始配送' },
  delivering: { status: 'completed', text: '确认送达' }
}

export function nextAction(order) {
  const a = NEXT_ACTION[order.status]
  if (!a) return null
  if (order.deliveryType === 'pickup' && order.status === 'preparing') return { ...a, text: '备货完成' }
  if (order.deliveryType === 'pickup' && order.status === 'delivering') return { ...a, text: '已取货' }
  return a
}

export const canRefund = (o) => ['pending', 'preparing', 'delivering', 'completed'].includes(o.status)

export const updateStatus = (id, status) => api.post(`/api/merchant/orders/${id}/status`, { status }, { merchant: true })

export function refundOrder(order) {
  return new Promise((resolve) => {
    uni.showModal({
      title: `退款 ¥${(order.payAmount / 100).toFixed(2)}`,
      content: '',
      editable: true,
      placeholderText: '退款原因（选填），款项将退回用户会员余额',
      confirmText: '确认退款',
      confirmColor: '#c0583c',
      success: async (r) => {
        if (!r.confirm) return resolve(null)
        const o = await api.post(`/api/merchant/orders/${order.id}/refund`, { reason: r.content || '商家退款' }, { merchant: true })
        uni.showToast({ title: '已退款至余额', icon: 'success' })
        resolve(o)
      },
      fail: () => resolve(null)
    })
  })
}
