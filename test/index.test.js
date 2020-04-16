const { readFileSync } = require('fs')
const test = require('ava')
const { parse } = require('iptv-playlist-parser')
const iptvChecker = require('./../src/index.js')
const testItems = require('./input/test-items.json')
const playlistFile = readFileSync(`${__dirname}/input/dummy.m3u`, {
  encoding: 'utf8',
})

function resultTester(results) {
  return results.every(item => {
    return (
      Reflect.has(item, `status`) &&
      Reflect.has(item.status, `ok`) &&
      (Reflect.has(item.status, `reason`) ||
        Reflect.has(item.status, `metadata`))
    )
  })
}

test.serial(`Should process an array of playlist items`, async t => {
  const results = await iptvChecker(testItems, { timeout: 2e3 })
  t.true(resultTester(results))
})

test.serial(`Should process a parsed playlist`, async t => {
  const playlist = parse(playlistFile)
  const results = await iptvChecker(playlist, { timeout: 2e3 })

  t.true(resultTester(results))
})
