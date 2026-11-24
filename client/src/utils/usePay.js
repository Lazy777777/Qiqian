import { reactive } from 'vue'
import { api } from './request'
import { requestWechatPayment, confirmMockPay } from './pay'
import { userState } from '../store'

// 页面里将 sheet 的 show/amount/description/loading 绑定到 <mock-pay-sheet>，
// 并在 @confirm / @cancel 中调用 sheet.onConfirm() / sheet.onCancel()
export function usePay() {
  const sheet = reactive({ show: false, amount: 0, description: '', loading: false, onConfirm: () => {}, onCancel: () => {} })

  // 微信支付（含模拟）：resolve 为 true 表示已支付，false 表示用户取消
  function wechatPay(prepay) {
    if (!prepay.mock) {
      return requestWechatPayment(prepay).then(() => true, () => false)
    }
    return new Promise((resolve, reject) => {
      Object.assign(sheet, {
        show: true,
        amount: prepay.amount,
        description: prepay.description,
        loading: false,
        onCancel: () => {
          sheet.show = false
          resolve(false)
        },
        onConfirm: async () => {
          sheet.loading = true
          try {
            const r = await confirmMockPay(prepay.paymentId)
            if (r.user) userState.user = r.user
            sheet.show = false
            resolve(true)
          } catch (e) {
            sheet.loading = false
            reject(e)
          }
        }
      })
    })
  }

  async function payOrder(orderId, method) {
    const r = await api.post(`/api/orders/${orderId}/pay`, { method })
    if (method === 'balance') {
      userState.user = r.user
      return true
    }
    return wechatPay(r.prepay)
  }

  async function recharge(amount) {
    const r = await api.post('/api/recharge', { amount })
    return wechatPay(r.prepay)
  }

  return { sheet, payOrder, recharge }
}
