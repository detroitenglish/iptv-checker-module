const util = require('util')
const execAsync = util.promisify(require('child_process').exec)

let cache = new Set()

function hashUrl(u) {
  return Buffer.from(u).toString(`hex`)
}

function addToCache({ url }) {
  let id = hashUrl(url)

  cache.add(id)
}

function checkCache({ url }) {
  let id = hashUrl(url)

  return cache.has(id)
}

function parseMessage(reason, { url }) {
  if (!reason) return

  const msgArr = reason.split('\n')

  if (msgArr.length === 0) return

  const line = msgArr.find(line => {
    return line.indexOf(url) === 0
  })

  if (!line) {
    if (/^Command failed/.test(reason)) return `Timed out`
    return reason
  }

  return line.replace(`${url}: `, '')
}

function debugLogger({ debug }) {
  let envDebug = /iptv-checker-module/.test(String(process.env.DEBUG))
  if (!debug && !envDebug) return () => {}
  return msg => {
    if (typeof msg === `object`) {
      return console.log(JSON.stringify(msg, null, 1))
    } else console.log(msg)
  }
}

function isJSON(str) {
  try {
    return !!JSON.parse(str)
  } catch (e) {
    return false
  }
}

function chunk(arr, size) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  )
}

function checkItem(item) {
  const { url } = item
  const {
    config: { userAgent, timeout },
  } = this

  return execAsync(
    `ffprobe -of json -v error -hide_banner -show_format -show_streams ${
      userAgent ? `-user_agent "${userAgent}"` : ``
    } ${url}`,
    { timeout }
  )
    .then(({ stdout }) => {
      if (!isJSON(stdout)) {
        return { ok: false, reason: parseMessage(stdout, item) }
      }
      const metadata = JSON.parse(stdout)
      return { ok: true, metadata }
    })
    .catch(err => ({ ok: false, reason: parseMessage(err.message, item) }))
}

async function validateStatus(item) {
  const status = await checkItem.call(this, item)

  if (status.ok) {
    this.stats.online++
    this.debugLogger(`OK: ${item.url}`.green)
  } else {
    this.stats.offline++
    this.debugLogger(
      `FAILED: ${item.url}`.red + `\n    Reason: ${status.reason}`.yellow
    )
  }

  return Object.assign(item, { status })
}

module.exports = {
  addToCache,
  checkCache,
  chunk,
  debugLogger,
  validateStatus,
}
