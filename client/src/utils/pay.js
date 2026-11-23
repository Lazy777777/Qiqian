import { api } from './request'

// 统一处理后端返回的预支付参数。
// mock：由页面上的 <mock-pay-sheet> 让用户确认，确认后调用 confirmMockPay。
// 真实微信支付：后端返回 timeStamp/nonceStr/package/signType/paySign，直接拉起 uni.requestPayment，
// 支付结果以后端 /api/pay/wechat-notify 回调为准，前端再轮询订单状态即可。
export function requestWechatPayment(prepay) {
  if (prepay.mock) return Promise.resolve({ mock: true })
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: prepay.timeStamp,
      nonceStr: prepay.nonceStr,
      package: prepay.package,
      signType: prepay.signType,
      paySign: prepay.paySign,
      success: () => resolve({ mock: false }),
      fail: reject
    })
  })
}

export const confirmMockPay = (paymentId) => api.post('/api/pay/mock-confirm', { paymentId })
