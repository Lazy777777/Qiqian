const fs = require('fs')
const path = require('path')
const store = require('./db')
const { ruleSinglePrice } = require('./specs')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
const ASSET_DIR = path.join(__dirname, '..', 'assets', 'products')

const categories = [
  { id: 'c_noodle', name: '速食泡面', sort: 1 },
  { id: 'c_snack', name: '零食卤味', sort: 2 },
  { id: 'c_drink', name: '饮品与饮用水', sort: 3 },
  { id: 'c_paper', name: '纸品日用', sort: 4 },
  { id: 'c_care', name: '女性护理', sort: 5 }
]

// 价格单位：分。pack 为整件内的件数和单包单位，可拆的单包价按 ruleSinglePrice 计算
const products = [
  {
    id: 'p_bucket6', categoryId: 'c_noodle', name: '大桶六连桶（备注口味）', price: 2990, unit: '组',
    desc: '杨掌柜大桶面 6 桶 · 冲泡即享 多种口味', detail: '下单时请在订单备注里写明想要的口味。', image: 'yangzhanggui-bucket.jpg'
  },
  {
    id: 'p_suancai', categoryId: 'c_noodle', name: '大桶杨掌柜酸菜牛肉味（单点不送）', price: 500, originalPrice: 590, unit: '桶',
    desc: '杨掌柜大桶 · 酸菜牛肉味', image: 'yangzhanggui-bucket.jpg'
  },
  {
    id: 'p_jintang', categoryId: 'c_noodle', name: '大桶杨掌柜金汤肥牛（单点不送）', price: 500, originalPrice: 590, unit: '桶',
    desc: '杨掌柜大桶 · 金汤肥牛味', image: 'yangzhanggui-bucket.jpg'
  },
  {
    id: 'p_maodu', categoryId: 'c_snack', name: '一把鼻涕一把泪缺牙齿素毛肚', price: 1580, unit: '盒',
    desc: '缺牙齿 · 湖南特产 麻辣素毛肚', image: 'queyachi-maodu.jpg'
  },
  {
    id: 'p_yazhua', categoryId: 'c_snack', name: '客家功夫鸭爪3重口味5个（单不）', price: 990, unit: '组',
    desc: '客家功夫泡鸭爪 · 清香 / 香辣 / 泡椒', image: 'kejia-yazhua.jpg', pack: [5, '个']
  },
  {
    id: 'p_labaicai', categoryId: 'c_snack', name: '咔吡咔吡辣白菜20包', price: 1580, unit: '袋',
    desc: '辣白菜味调味面制品 · 够麻够辣', image: 'labaicai.jpg', pack: [20, '包']
  },
  {
    id: 'p_yabo', categoryId: 'c_snack', name: '好味屋劲卤鸭脖5根（单点不送）', price: 990, unit: '组',
    desc: '好味屋劲卤 · 黑鸭味 / 香辣味', image: 'haoweiwu-yabo.jpg', pack: [5, '根']
  },
  {
    id: 'p_doubendou', categoryId: 'c_drink', name: '豆本豆六盒（单点不送）', price: 990, unit: '组',
    desc: '唯甄原味豆奶 250ml×6盒', image: 'doubendou.jpg', pack: [6, '盒']
  },
  {
    id: 'p_lanbiao', categoryId: 'c_drink', name: '今麦郎蓝标水24瓶', price: 1400, unit: '箱',
    desc: '蓝标纯净软水 · 24 瓶整箱', image: 'lanbiao-water.jpg', pack: [24, '瓶']
  },
  {
    id: 'p_nongfu', categoryId: 'c_drink', name: '农夫山泉1.5升大水', price: 300, unit: '瓶',
    desc: '农夫山泉饮用天然水 1.5L', image: 'nongfu-1-5l.jpg'
  },
  {
    id: 'p_nongfu12', categoryId: 'c_drink', name: '农夫山泉1.5升大水12瓶', price: 3300, unit: '箱',
    desc: '农夫山泉饮用天然水 1.5L×12瓶', image: 'nongfu-1-5l-12.jpg'
  },
  {
    id: 'p_nongfu24', categoryId: 'c_drink', name: 'Nongfu Spring24瓶', price: 1700, unit: '箱',
    desc: '农夫山泉饮用天然水 24 瓶整箱', image: 'nongfu-24.jpg', pack: [24, '瓶'], stock: 0
  },
  {
    id: 'p_runtian', categoryId: 'c_drink', name: '一件24瓶润田王', price: 1750, unit: '件',
    desc: '润田饮用水 24 瓶整件', image: 'runtian-24.jpg', pack: [24, '瓶']
  },
  {
    id: 'p_qingfeng', categoryId: 'c_paper', name: '清风大抽纸', price: 990, originalPrice: 1290, unit: '提',
    desc: '清风丝柔亲肤 · 悬挂式抽纸', image: 'qingfeng-tissue.jpg'
  },
  {
    id: 'p_care_ask', categoryId: 'c_care', name: '3日用+1迷你+1夜用+1安睡裤', price: 4780, unit: '组',
    desc: '自由点卫生巾组合装', detail: '自由点：3包日用➕一包夜用➕一包迷你➕一包安睡裤', image: 'ziyoudian-anshuiku.jpg'
  },
  {
    id: 'p_care_long', categoryId: 'c_care', name: '3日用+1夜用+1迷你+1加长', price: 4780, unit: '组',
    desc: '自由点卫生巾组合装', detail: '自由点卫生巾: 三包日用，一包夜用，一包加长，一包迷你', image: 'ziyoudian-la88.jpg'
  },
  {
    id: 'p_anshuiku', categoryId: 'c_care', name: '3片安睡裤M-L码（单点不送）', price: 990, unit: '包',
    desc: '自由点安睡裤 M-L 码 · 3 片装', image: 'ziyoudian-anshuiku.jpg'
  },
  {
    id: 'p_day240', categoryId: 'c_care', name: '3连包24片240mm日用自由点', price: 2970, unit: '组',
    desc: '自由点益生菌卫生巾 · 240mm 日用', detail: '三包组合，不能拆开', image: 'ziyoudian-la88.jpg'
  },
  {
    id: 'p_night280', categoryId: 'c_care', name: '8片280夜用（单点不送）', price: 990, unit: '包',
    desc: '自由点益生菌卫生巾 · 280mm 夜用', image: 'ziyoudian-280.jpg'
  },
  {
    id: 'p_night430', categoryId: 'c_care', name: '4+2片430夜用要（单点不送）', price: 990, unit: '包',
    desc: '自由点益生菌夜用 · 430mm', image: 'ziyoudian-430.jpg'
  },
  {
    id: 'p_mini190', categoryId: 'c_care', name: '迷你190mm卫生巾（单点不送）', price: 890, unit: '包',
    desc: '自由点益生菌卫生巾 · 190mm 迷你', image: 'ziyoudian-la88.jpg'
  }
]

function seed({ force = false } = {}) {
  if (!force && fs.existsSync(store.DB_FILE)) return false
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const now = Date.now()
  const list = products.map((p) => {
    fs.copyFileSync(path.join(ASSET_DIR, p.image), path.join(UPLOAD_DIR, p.image))
    const [packCount, singleUnit] = p.pack || [0, '包']
    return {
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      desc: p.desc || '',
      detail: p.detail || '',
      price: p.price,
      originalPrice: p.originalPrice || null,
      unit: p.unit,
      image: `/uploads/${p.image}`,
      packCount,
      singleUnit,
      singlePrice: p.pack ? ruleSinglePrice(p.price, packCount) : null,
      looseStock: 0,
      stock: p.stock ?? 99,
      onSale: true,
      sales: 0,
      createdAt: now
    }
  })
  store.reset({ categories, products: list, settings: { minOrderAmount: 1500 } })
  return true
}

module.exports = { seed }

if (require.main === module) {
  const done = seed({ force: process.argv.includes('--force') })
  console.log(done ? '已写入示例数据：' + store.DB_FILE : '数据已存在，使用 --force 覆盖')
}
