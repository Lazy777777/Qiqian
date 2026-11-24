# 课余时光 · 校园百货外卖订购小程序

基于 **uni-app（Vue 3 + Vite）** 的百货外卖订购小程序，可同时编译为 **微信小程序** 和 **H5**；配套一个轻量的 **Node.js + Express** 后端（JSON 文件存储），订单、菜单、地址、余额等数据在用户端和商家端之间共享。

> 店名、Logo、客服电话在 `client/src/config.js`（导航栏标题在 `client/src/pages.json`、`client/src/manifest.json`）。Logo 是透明背景 PNG：`client/src/static/logo.png`。

## 功能

**用户端**

- 首页：清新明亮的校园风（珊瑚橙 / 薄荷绿 / 浅蓝）、店铺 Logo、手绘插画、大圆角白卡片；「速食泡面 / 纸品日用 / 饮品饮用水」分类入口直达选购页，以及 VIP 会员卡
- 选购：分类为 速食泡面 / 零食卤味 / 饮品与饮用水 / 纸品日用 / 女性护理；左侧分类 + 右侧商品，显示原价与折扣，点商品弹出详情
- **整件 / 单包规格**：整袋、整盒、整箱商品可拆开按单包卖，点「选规格」选择「整件」或「单包」；单包价规则为 整件价 ÷ 件数，不到 1 元按 1 元/包，超过 1 元按 2 元/包
- **起送价**：商品金额（不含配送费）满 ¥15 才能下单，不足时选购页、购物车、结算页都会显示「还差 ¥x 起送」并禁止下单，后端也会校验；商家可在后台修改
- 购物车：勾选 / 全选、修改数量、批量删除，同一商品的整件和单包分开显示
- 订单备注：名称带「备注口味」的商品必须在结算页填写备注
- 收货地址：新增 / 编辑 / 删除 / 设为默认，多地址管理，结算时选择；小程序下支持一键导入微信地址
- 下单付款：仅外卖配送，会员余额支付 / 微信支付（模拟），生成并展示订单号
- 我的订单：按状态筛选，状态为 待付款 / 待接单 / 备货中 / 配送中 / 已完成 / 已退款 / 已取消，详情页带进度条，自动刷新
- VIP 会员卡：余额、积分、等级（普通 / 银卡 / 金卡，按累计充值升级，享免配送费、95 折），充值档位带赠送，余额明细

**商家端**（独立入口：「我的 → 商家入口」，或 H5 直接访问 `/#/pages/merchant/login`）

- 简单密码登录（默认 `admin123`，用环境变量 `MERCHANT_PASSWORD` 修改）
- 订单看板：新订单数 / 进行中 / 今日单量 / 今日营业额；新订单高亮并带 NEW 标记，每 8 秒轮询，有新单时震动提醒
- 订单详情：收货地址、用户手机号，**一键拨打**（小程序用 `uni.makePhoneCall`，H5 用 `tel:` 链接）
- 修改订单状态（接单 → 备货中 → 配送中 → 已完成，也可直接点选）
- 退款：原路退回用户会员余额（同时返还库存、扣回积分），可填写退款原因
- 商品管理：新增 / 编辑 / 删除、上下架、价格与划线价、库存、商品详情、图片上传（或填图片地址），分类新增 / 删除
- 拆包规格：开启「拆包销售」后填写整件件数、单包单位、单包价（可一键按规则计算）、散包库存；订单详情里拆包商品带「拆包」标记
- 店铺设置：起送价（默认 15 元，填 0 不限制）

## 目录结构

```
client/   uni-app 前端（用户端 + 商家端）
  src/pages/          页面（index 首页、menu 选购、cart、checkout、order、address、vip、mine、merchant/*）
  src/components/     商品详情 / 规格弹窗、模拟微信支付弹窗、数量步进器、拨号按钮
  src/store/          用户、购物车状态
  src/utils/          请求封装、支付适配、格式化
  src/static/logo.png 店铺 Logo（透明背景）
  src/static/illus/   插画（杯面、纸巾盒、桶装水、吃面女孩，透明背景 PNG）
  src/static/tab/     tabBar 图标
server/   Node + Express 后端
  src/index.js        全部 API
  src/payment.js      支付适配层（模拟 / 预留真实微信支付）
  src/specs.js        整件 / 单包规格、单包定价规则、拆包库存
  src/seed.js         店铺菜单（分类、商品、价格、拆包规格）
  assets/products/    商品主图（首次启动复制到 uploads/）
  data/db.json        运行后自动生成的数据文件（已 gitignore）
  uploads/            商品图片（已 gitignore）
```

## 免安装静态演示

`demo/index.html` 是零依赖的单文件演示版（图片在 `demo/assets/`），双击用浏览器打开即可，不需要后端、npm 或构建。数据保存在浏览器 localStorage 里，「我的 → 重置演示数据」可恢复初始商品。商家端从「我的 → 商家入口」进入，密码 `admin123`。

## 本地运行

需要 Node.js 18+（开发时使用 Node 22）。

```bash
# 1. 安装依赖
npm run install:all          # 等价于分别在 server/ 和 client/ 下 npm install

# 2. 启动后端（默认 http://localhost:3000，首次启动自动写入示例商品）
npm run server

# 3. 另开一个终端，启动 H5 开发服务（默认 http://localhost:5173）
npm run dev:h5
```

`npm run dev:h5` 启动后，用浏览器打开下面的地址即可查看（建议在开发者工具里切换到手机尺寸，如 390×844）：

- 用户端首页：<http://localhost:5173/#/>
- 商家端入口：<http://localhost:5173/#/pages/merchant/login>（默认密码 `admin123`）

H5 开发模式下 `/api` 与 `/uploads` 由 Vite 代理到后端（可用环境变量 `API_TARGET` 改代理目标），所以需要先启动后端。

### 后端配置

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 监听端口 |
| `MERCHANT_PASSWORD` | `admin123` | 商家后台密码 |
| `PAY_MODE` | `mock` | 支付模式，目前仅实现 `mock` |
| `DATA_DIR` | `server/data` | 数据文件目录 |

重置为初始菜单：`npm run seed`（会覆盖 `server/data/db.json`，清空用户、订单等数据）。从旧版本升级时需要执行一次，才能换成新的菜单和起送价设置。

单包库存按「整件库存 × 件数 + 散包库存」计算：卖出单包时先用散包，不够再自动拆开一整件；单包退款退回散包库存。

## 编译微信小程序

1. 修改 `client/src/manifest.json` 中 `mp-weixin.appid` 为你的小程序 AppID（不填则在开发者工具中使用测试号）。
2. 设置后端地址：小程序不能使用 Vite 代理，默认请求 `http://127.0.0.1:3000`。真机或上线时请改为 HTTPS 域名，例如：

   ```bash
   # client/.env.production 或命令行环境变量
   VITE_API_BASE=https://api.example.com
   ```

3. 编译：

   ```bash
   npm run dev:mp-weixin     # 开发模式，监听文件变化，输出 client/dist/dev/mp-weixin
   npm run build:mp-weixin   # 发行版，输出 client/dist/build/mp-weixin
   ```

4. 打开「微信开发者工具」→ 导入项目 → 选择上面的输出目录。本地调试时在「详情 → 本地设置」勾选「不校验合法域名」（`manifest.json` 已设置 `urlCheck: false`）；上线前需在小程序后台配置 request / uploadFile 合法域名。

## 编译 H5 发行版

```bash
npm run build:h5        # 输出 client/dist/build/h5
npm run server          # 后端检测到该目录后会直接托管 H5 页面：http://localhost:3000
```

## 支付说明（模拟支付 + 预留接入点）

真实微信支付需要商户号，目前实现为模拟支付：

- **余额支付**：后端直接扣减会员余额并记录余额明细。
- **微信支付（模拟）**：后端 `createWechatPrepay` 生成支付单，前端弹出「微信支付（模拟）」确认面板，确认后调用 `/api/pay/mock-confirm` 模拟支付回调。充值也走这条链路。

接入真实微信支付时：

1. 在 `server/src/payment.js` 的 `createWechatPrepay` 中调用微信支付 v3 JSAPI 下单接口，返回 `timeStamp / nonceStr / package / signType / paySign`，并设置 `PAY_MODE=wechat`。
2. 实现 `server/src/index.js` 中预留的 `/api/pay/wechat-notify`：验签、解密后调用 `completePayment(payment)`。
3. 前端无需改页面：`client/src/utils/pay.js` 的 `requestWechatPayment` 在非模拟模式下会调用 `uni.requestPayment`。
4. 用户登录目前以设备 ID 识别用户；小程序上线时建议在 `ensureLogin`（`client/src/store/index.js`）中加入 `uni.login` 的 code，后端用 `jscode2session` 换取 openid。

## 主要 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/user/login` | 以设备 ID 登录 / 注册 |
| GET | `/api/user/me` | 用户信息（余额、积分、会员等级） |
| GET | `/api/menu` | 分类与在售商品 |
| GET/POST/PUT/DELETE | `/api/addresses` | 收货地址 |
| POST | `/api/orders/preview` | 计算金额（折扣、配送费、距起送还差多少）；`items` 为 `{ productId, spec, qty }`，`spec` 为 `whole` / `single` |
| POST | `/api/orders` | 创建订单（待付款），商品金额不足起送价时返回 400 |
| POST | `/api/orders/:id/pay` | 支付：`balance` 或 `wechat` |
| POST | `/api/recharge` | 发起充值 |
| POST | `/api/pay/mock-confirm` | 模拟微信支付确认 |
| POST | `/api/merchant/login` | 商家登录 |
| GET | `/api/merchant/orders` | 商家订单列表 |
| POST | `/api/merchant/orders/:id/status` | 修改订单状态 |
| POST | `/api/merchant/orders/:id/refund` | 退款到余额 |
| GET/POST/PUT/DELETE | `/api/merchant/products` | 商品管理（含 `packCount` / `singlePrice` / `singleUnit` / `looseStock` 拆包字段） |
| GET/PUT | `/api/merchant/settings` | 店铺设置（起送价 `minOrderAmount`，单位分） |
| POST | `/api/merchant/upload` | 上传商品图片 |
