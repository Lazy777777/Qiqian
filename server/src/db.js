const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

const EMPTY = {
  users: [],
  categories: [],
  products: [],
  addresses: [],
  orders: [],
  recharges: [],
  balanceLogs: [],
  payments: [],
  merchantSessions: [],
  settings: {}
}

let state = null
let writeTimer = null

function load() {
  if (state) return state
  fs.mkdirSync(DATA_DIR, { recursive: true })
  if (fs.existsSync(DB_FILE)) {
    state = { ...EMPTY, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) }
  } else {
    state = JSON.parse(JSON.stringify(EMPTY))
  }
  return state
}

function flush() {
  if (!state) return
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2))
  fs.renameSync(tmp, DB_FILE)
}

// 合并短时间内的多次写入，进程退出前强制落盘
function save() {
  clearTimeout(writeTimer)
  writeTimer = setTimeout(flush, 50)
}

function reset(data) {
  state = { ...JSON.parse(JSON.stringify(EMPTY)), ...data }
  flush()
}

function id(prefix = '') {
  return prefix + crypto.randomBytes(6).toString('hex')
}

process.on('exit', flush)
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    flush()
    process.exit(0)
  })
}

module.exports = {
  get db() {
    return load()
  },
  save,
  flush,
  reset,
  id,
  DB_FILE
}
