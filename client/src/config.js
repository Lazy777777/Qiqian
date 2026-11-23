// 店铺信息：改成自己的店名即可
export const STORE = {
  name: '鲜邻百货',
  title: 'GROCERY STORE',
  slogan: '新鲜到家 · 30 分钟送达',
  phone: '400-000-0000',
  address: '本店地址（请在 src/config.js 修改）'
}

// 后端地址：H5 开发环境走 Vite 代理（留空）；小程序需填写可访问的完整地址
let base = import.meta.env.VITE_API_BASE || ''
// #ifdef MP-WEIXIN
if (!base) base = 'http://127.0.0.1:3000'
// #endif
export const API_BASE = base
