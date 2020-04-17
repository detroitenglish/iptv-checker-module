const { readFileSync } = require('fs')
const test = require('ava')
const iptvChecker = require('./../src/index.js')

const playlistPath = `${__dirname}/input/dummy.m3u`

const playlistFile = readFileSync(playlistPath, {
  encoding: 'utf8',
})

function resultTester(result) {
  return result.items.every(item => {
    return (
      Reflect.has(item, `status`) &&
      Reflect.has(item.status, `ok`) &&
      (Reflect.has(item.status, `reason`) ||
        Reflect.has(item.status, `metadata`))
    )
  })
}

test.serial(`Should process a playlist URL`, async t => {
  const url = 'https://iptv-org.github.io/iptv/categories/classic.m3u'
  const results = await iptvChecker(url, { timeout: 2e3, parallel: 1 })

  t.true(resultTester(results))
})

test.serial(`Should process a playlist file path`, async t => {
  const results = await iptvChecker(playlistPath, { timeout: 2e3, parallel: 1 })

  t.true(resultTester(results))
})

test.serial(`Should process a playlist Buffer`, async t => {
  const playlistBuffer = Buffer.from(playlistFile)
  const results = await iptvChecker(playlistBuffer, {
    timeout: 2e3,
    parallel: 1,
  })

  t.true(resultTester(results))
})

test.serial(`Should throw with invalid input`, async t => {
  await t.throwsAsync(() =>
    iptvChecker(1, {
      timeout: 2e3,
      parallel: 1,
    })
  ),
    { instanceOf: TypeError }
})
