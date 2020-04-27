require('colors')
const helper = require('./helper')
const { isWebUri } = require('valid-url')
const procs = require('os').cpus().length - 1
const commandExists = require('command-exists')

let stats = {
  total: 0,
  online: 0,
  offline: 0,
  duplicates: 0,
}

const defaultConfig = {
  debug: false,
  userAgent: null,
  timeout: 1e4,
  parallel: procs || 1,
  omitMetadata: false,
  itemCallback: () => {},
}

module.exports = async function (input, opts = {}) {
  await commandExists(`ffprobe`).catch(() => {
    throw new Error(
      `Executable "ffprobe" not found. Have you installed "ffmpeg"?`
    )
  })

  const playlist = await helper.parsePlaylist(input)

  const config = { ...defaultConfig, ...opts }

  const debugLogger = helper.debugLogger(config)

  debugLogger({ config })

  console.time('Execution time')

  const duplicates = []

  const items = playlist.items
    .filter(item => isWebUri(item.url))
    .map(item => {
      if (helper.checkCache(item)) {
        duplicates.push(item)
        return null
      } else {
        helper.addToCache(item)
        return item
      }
    })
    .filter(Boolean)

  stats.total = items.length + duplicates.length

  stats.duplicates = duplicates.length

  debugLogger(`Checking ${stats.total} playlist items...`)

  if (duplicates.length)
    debugLogger(`Found ${stats.duplicates} duplicates...`.yellow)

  for (let item of duplicates) {
    item.status = { ok: false, reason: `Duplicate` }
    await config.itemCallback(item)
  }

  const ctx = { config, stats, debugLogger }

  const validator = helper.validateStatus.bind(ctx)

  let results = []

  if (+config.parallel === 1) {
    for (let item of items) {
      results.push(await validator(item))
    }
  } else {
    for (let [...chunk] of helper.chunk(items, +config.parallel)) {
      results.push(...(await Promise.all(chunk.map(validator))))
    }
  }

  results = helper.flatten(results).concat(duplicates)

  if (config.debug) {
    console.timeEnd('Execution time')
    let colors = {
      total: `white`,
      online: `green`,
      offline: `red`,
      duplicates: `yellow`,
    }
    for (let [key, val] of Object.entries(ctx.stats)) {
      debugLogger(`${key.toUpperCase()}: ${val}`[colors[key]])
    }
  }

  if (config.omitMetadata) {
    for (let result of results) {
      delete result.status.metadata
    }
  }

  playlist.items = results

  return playlist
}
