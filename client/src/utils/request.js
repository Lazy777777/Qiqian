import { API_BASE } from '../config'

const DEVICE_KEY = 'device_id'
const USER_KEY = 'user_id'
const MERCHANT_KEY = 'merchant_token'

export function getDeviceId() {
  let id = uni.getStorageSync(DEVICE_KEY)
  if (!id) {
    id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    uni.setStorageSync(DEVICE_KEY, id)
  }
  return id
}

export const getUserId = () => uni.getStorageSync(USER_KEY)
export const setUserId = (id) => uni.setStorageSync(USER_KEY, id)
export const getMerchantToken = () => uni.getStorageSync(MERCHANT_KEY)
export const setMerchantToken = (t) => (t ? uni.setStorageSync(MERCHANT_KEY, t) : uni.removeStorageSync(MERCHANT_KEY))

export function request(url, { method = 'GET', data, merchant = false, silent = false } = {}) {
  const header = { 'Content-Type': 'application/json' }
  if (merchant) header['X-Merchant-Token'] = getMerchantToken() || ''
  else if (getUserId()) header['X-User-Id'] = getUserId()

  return new Promise((resolve, reject) => {
    uni.request({
      url: API_BASE + url,
      method,
      data,
      header,
      success: (res) => {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300 && body.ok) return resolve(body.data)
        const message = body.message || '网络繁忙，请稍后再试'
        if (res.statusCode === 401 && merchant) {
          setMerchantToken('')
          uni.reLaunch({ url: '/pages/merchant/login' })
        } else if (!silent) {
          uni.showToast({ title: message, icon: 'none' })
        }
        reject(Object.assign(new Error(message), { status: res.statusCode }))
      },
      fail: (err) => {
        if (!silent) uni.showToast({ title: '无法连接服务器', icon: 'none' })
        reject(err)
      }
    })
  })
}

export const api = {
  get: (url, opt) => request(url, { ...opt, method: 'GET' }),
  post: (url, data, opt) => request(url, { ...opt, method: 'POST', data }),
  put: (url, data, opt) => request(url, { ...opt, method: 'PUT', data }),
  del: (url, opt) => request(url, { ...opt, method: 'DELETE' })
}

export function imgUrl(path) {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/.test(path) || path.startsWith('/static/')) return path
  return API_BASE + path
}

export function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: API_BASE + '/api/merchant/upload',
      filePath,
      name: 'file',
      header: { 'X-Merchant-Token': getMerchantToken() || '' },
      success: (res) => {
        let body = {}
        try {
          body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        } catch (e) {}
        if (body.ok) resolve(body.data.url)
        else {
          uni.showToast({ title: body.message || '上传失败', icon: 'none' })
          reject(new Error(body.message))
        }
      },
      fail: reject
    })
  })
}
