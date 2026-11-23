// 支付适配层。
// 当前 PAY_MODE=mock：生成模拟预支付单，由前端“模拟微信支付”弹窗确认后回调 /api/pay/mock-confirm。
// 接入真实微信支付（JSAPI / 小程序支付 v3）时，在 createWechatPrepay 中调用
//   POST https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi
// 用商户私钥签名生成 timeStamp/nonceStr/package/signType/paySign 返回给小程序 uni.requestPayment，
// 并实现 /api/pay/wechat-notify 回调：验签、解密后调用 markPaid(payment)。
const store = require('./db')

const PAY_MODE = process.env.PAY_MODE || 'mock'

function createWechatPrepay({ userId, bizType, bizId, amount, description }) {
  const { db } = store
  const payment = {
    id: store.id('pay_'),
    userId,
    bizType, // 'order' | 'recharge'
    bizId,
    amount,
    description,
    channel: 'wechat',
    status: 'pending',
    createdAt: Date.now()
  }
  db.payments.push(payment)
  store.save()

  if (PAY_MODE === 'mock') {
    return { mock: true, paymentId: payment.id, amount, description }
  }
  // TODO: 真实微信支付，返回 uni.requestPayment 所需参数
  // return { mock: false, paymentId: payment.id, timeStamp, nonceStr, package: `prepay_id=${prepayId}`, signType: 'RSA', paySign }
  throw new Error('真实微信支付尚未配置商户号，请设置 PAY_MODE=mock')
}

module.exports = { PAY_MODE, createWechatPrepay }
