// 线条插画风格的商品示意图（SVG），用于种子数据。商家可在后台替换为真实图片。
const INK = '#2b3440'

const wrap = (body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
<rect width="200" height="200" rx="36" fill="${bg}"/>
<g fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</g>
</svg>`

const shapes = {
  bottle: (c) => `
    <path d="M86 40h28v18c0 6 14 12 14 30v70c0 8-6 14-14 14H86c-8 0-14-6-14-14V88c0-18 14-24 14-30z" fill="#fff"/>
    <rect x="84" y="28" width="32" height="14" rx="4" fill="${c}"/>
    <rect x="72" y="100" width="56" height="40" fill="${c}"/>
    <path d="M90 120h20"/>`,
  milk: (c) => `
    <path d="M70 70l14-26h32l14 26v94c0 6-4 10-10 10H80c-6 0-10-4-10-10z" fill="#fff"/>
    <path d="M84 44V30h32v14" fill="${c}"/>
    <path d="M70 70h60"/>
    <path d="M70 110c12-8 22 8 32 0s20-8 28 0v34H70z" fill="${c}"/>`,
  apple: (c) => `
    <path d="M100 66c-10-10-46-12-46 28 0 34 24 66 46 54 22 12 46-20 46-54 0-40-36-38-46-28z" fill="${c}"/>
    <path d="M100 66c0-12 4-22 10-28"/>
    <path d="M106 50c10-12 26-10 30-6-6 10-20 12-30 6z" fill="#9db37a"/>
    <path d="M72 96c2-8 8-14 14-16"/>`,
  egg: (c) => `
    <path d="M40 120h120v30c0 10-8 18-18 18H58c-10 0-18-8-18-18z" fill="${c}"/>
    <ellipse cx="70" cy="100" rx="18" ry="24" fill="#fff"/>
    <ellipse cx="100" cy="94" rx="18" ry="26" fill="#fff"/>
    <ellipse cx="130" cy="100" rx="18" ry="24" fill="#fff"/>
    <path d="M40 120h120"/>`,
  bread: (c) => `
    <path d="M44 92c0-24 24-36 56-36s56 12 56 36c0 10-8 14-12 14v50c0 6-4 10-10 10H66c-6 0-10-4-10-10v-50c-4 0-12-4-12-14z" fill="${c}"/>
    <path d="M80 86c4 8 4 16 0 24M100 82c4 10 4 20 0 30M120 86c4 8 4 16 0 24"/>`,
  noodle: (c) => `
    <path d="M52 76h96l-12 92H64z" fill="#fff"/>
    <path d="M48 64h104v14H48z" fill="${c}"/>
    <path d="M60 110h80" />
    <circle cx="100" cy="134" r="14" fill="${c}"/>
    <path d="M110 64c0-14 10-26 22-32M120 64c2-12 12-22 24-26"/>`,
  tissue: (c) => `
    <path d="M40 92h120v62c0 6-4 10-10 10H50c-6 0-10-4-10-10z" fill="${c}"/>
    <path d="M40 92l16-22h88l16 22"/>
    <path d="M86 80c0-18 28-30 28-10 0 6-4 10-8 10" fill="#fff"/>
    <path d="M60 126h80"/>`,
  snack: (c) => `
    <path d="M60 40h80l-6 14 6 14v66l-6 14 6 14H60l6-14-6-14V68l6-14z" fill="${c}"/>
    <circle cx="100" cy="102" r="20" fill="#fff"/>
    <path d="M92 102h16M100 94v16"/>
    <path d="M66 54h68M66 148h68"/>`,
  veg: (c) => `
    <path d="M100 170c-24 0-40-28-34-62l34-12 34 12c6 34-10 62-34 62z" fill="${c}"/>
    <path d="M100 96c-6-20-24-34-40-34 4 18 20 30 40 34zM100 96c6-20 24-34 40-34-4 18-20 30-40 34zM100 96V44"/>
    <path d="M84 128h10M102 146h12M96 112h14"/>`,
  coffee: (c) => `
    <path d="M64 72h72l-8 96H72z" fill="#fff"/>
    <rect x="58" y="58" width="84" height="16" rx="6" fill="${c}"/>
    <path d="M68 104h64l-3 34H71z" fill="${c}"/>
    <path d="M110 58l20-30"/>
    <circle cx="100" cy="121" r="7"/>`
}

function productSvg(shape, color = '#c89a6b', bg = '#eef7f4') {
  return wrap((shapes[shape] || shapes.snack)(color), bg)
}

module.exports = { productSvg, shapes: Object.keys(shapes) }
