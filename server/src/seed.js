const fs = require('fs')
const path = require('path')
const store = require('./db')
const { productSvg } = require('./illustrations')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')

const categories = [
  { id: 'c_fresh', name: '新鲜果蔬', sort: 1 },
  { id: 'c_dairy', name: '乳品烘焙', sort: 2 },
  { id: 'c_drink', name: '酒水饮料', sort: 3 },
  { id: 'c_snack', name: '休闲零食', sort: 4 },
  { id: 'c_grain', name: '粮油速食', sort: 5 },
  { id: 'c_daily', name: '日用百货', sort: 6 }
]

// 价格单位：分
const products = [
  ['p_apple', 'c_fresh', '烟台红富士苹果', '脆甜多汁 约1kg', 1690, 1990, '份', 'apple', '#d9775a'],
  ['p_veg', 'c_fresh', '有机小青菜', '当日采摘 约500g', 590, 690, '份', 'veg', '#9db37a'],
  ['p_egg', 'c_fresh', '散养土鸡蛋', '10枚装 新鲜直供', 1880, 2280, '盒', 'egg', '#e0b77d'],
  ['p_milk', 'c_dairy', '纯牛奶', '250ml×12盒 整箱', 4590, 5290, '箱', 'milk', '#b9c9d9'],
  ['p_yogurt', 'c_dairy', '原味老酸奶', '180g×4杯', 1590, null, '组', 'milk', '#e8c7c0'],
  ['p_bread', 'c_dairy', '手撕吐司面包', '奶香浓郁 400g', 1290, null, '袋', 'bread', '#d6a46b'],
  ['p_water', 'c_drink', '天然矿泉水', '550ml×24瓶', 2990, 3490, '箱', 'bottle', '#9fc4d6'],
  ['p_cola', 'c_drink', '可乐汽水', '330ml×6罐', 1590, null, '组', 'bottle', '#c9584c'],
  ['p_coffee', 'c_drink', '冷萃美式咖啡', '即饮 270ml', 790, 990, '瓶', 'coffee', '#a9785a'],
  ['p_chips', 'c_snack', '薯片 原味', '大包装 135g', 990, null, '袋', 'snack', '#e6c15a'],
  ['p_nuts', 'c_snack', '每日坚果', '25g×7袋', 3990, 4590, '盒', 'snack', '#b98b62'],
  ['p_noodle', 'c_grain', '红烧牛肉面', '桶装 5桶', 2290, null, '组', 'noodle', '#d9775a'],
  ['p_oil', 'c_grain', '花生油', '物理压榨 1.8L', 3990, 4590, '桶', 'bottle', '#e3b54f'],
  ['p_tissue', 'c_daily', '抽纸', '3层120抽×6包', 1990, 2490, '提', 'tissue', '#cfe0d2'],
  ['p_bag', 'c_daily', '加厚垃圾袋', '50只×3卷', 990, null, '组', 'tissue', '#a8b3c7']
]

function seed({ force = false } = {}) {
  if (!force && fs.existsSync(store.DB_FILE)) return false
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const now = Date.now()
  const list = products.map(([id, categoryId, name, desc, price, originalPrice, unit, shape, color], i) => {
    const file = `${id}.svg`
    fs.writeFileSync(path.join(UPLOAD_DIR, file), productSvg(shape, color))
    return {
      id,
      categoryId,
      name,
      desc,
      price,
      originalPrice,
      unit,
      image: `/uploads/${file}`,
      stock: 99,
      onSale: true,
      sales: 20 + ((i * 37) % 180),
      createdAt: now
    }
  })
  store.reset({ categories, products: list })
  return true
}

module.exports = { seed }

if (require.main === module) {
  const done = seed({ force: process.argv.includes('--force') })
  console.log(done ? '已写入示例数据：' + store.DB_FILE : '数据已存在，使用 --force 覆盖')
}
