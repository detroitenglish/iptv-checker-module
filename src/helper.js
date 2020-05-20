const Axios = require('axios')
const util = require('util')
const { parse } = require('iptv-playlist-parser')
const { isWebUri } = require('valid-url')
const { existsSync, readFile } = require('fs')

const execAsync = util.promisify(require('child_process').exec)
const readFileAsync = util.promisify(readFile)

const axios = Axios.create({
  method: 'GET',
  timeout: 6e4, // 60 second timeout
  responseType: 'text',
  headers: {
    accept: 'audio/x-mpegurl',
  },
})

axios.interceptors.response.use(
  response => {
    const { 'content-type': contentType = '' } = response.headers
    if (contentType !== 'audio/x-mpegurl') {
      throw new Error('URL is not an .m3u playlist file')
    }
    return response.data
  },
  error => {
    let msg
    if (error.response) {
      msg = error.response.data
    } else {
      msg = `Error fetching playlist`
    }

    return Promise.reject(new Error(msg))
  }
)

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

async function parsePlaylist(input) {
  if (input instanceof Object) return input

  let data = input

  if (Buffer.isBuffer(input)) {
    data = input.toString(`utf8`)
  } else if (typeof input === `string`) {
    if (isWebUri(input)) {
      data = await axios(input)
    } else if (existsSync(input)) {
      data = await readFileAsync(input, { encoding: `utf8` })
    }
  }

  return parse(data)
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

function orderBy(arr, props, orders) {
  return [...arr].sort((a, b) =>
    props.reduce((acc, prop, i) => {
      if (acc === 0) {
        const [p1, p2] =
          orders && orders[i] === 'desc'
            ? [b[prop], a[prop]]
            : [a[prop], b[prop]]
        acc = p1 > p2 ? 1 : p1 < p2 ? -1 : 0
      }
      return acc
    }, 0)
  )
}

function checkItem(item) {
  const { url } = item
  const {
    config: { userAgent, timeout },
  } = this

  return execAsync(
    `ffprobe -of json -v error -hide_banner -show_format -show_streams ${
      userAgent ? `-user_agent '${userAgent}'` : ``
    } '${url}'`,
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
  item.status = await checkItem.call(this, item)

  if (item.status.ok) {
    this.stats.online++
    this.debugLogger(`OK: ${item.url}`.green)
  } else {
    this.stats.offline++
    this.debugLogger(
      `FAILED: ${item.url}`.red + ` (${item.status.reason})`.yellow
    )
  }

  await this.config.itemCallback.call(null, item)

  return item
}

function statsLogger({ config, stats, debugLogger }) {
  if (!config.debug) return

  console.timeEnd('Execution time')

  let colors = {
    total: `white`,
    online: `green`,
    offline: `red`,
    duplicates: `yellow`,
  }

  for (let [key, val] of Object.entries(stats)) {
    debugLogger(`${key.toUpperCase()}: ${val}`[colors[key]])
  }
}

module.exports = {
  addToCache,
  checkCache,
  chunk,
  debugLogger,
  orderBy,
  parsePlaylist,
  statsLogger,
  validateStatus,
}
