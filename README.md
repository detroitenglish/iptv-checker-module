# IPTV Checker Module

A module for checking channel links in IPTV playlists parsed by [iptv-playlist-parser](https://www.npmjs.com/package/iptv-playlist-parser).

## Requirements

This tool requires the `ffmpeg` library, so you need to have it installed on your device. You can find the right [installer for your system here](https://www.ffmpeg.org/download.html).

## Example

```javascript
const iptvChecker = require('iptv-checker-module')
const { parse } = require('iptv-playlist-parser')

const opts = {
  timeout: 5000,
  parallel: 2,
}

// Example in browser with fetched playlist
fetch('/some-iptv-playlist.m3u')
  .then(response => response.text())
  .then(parser)
  .then(({ items }) => iptvChecker(items, opts))
  .catch(console.error.bind(console))

// Example in Node with local playlist file
const { readFileSync } = require('fs')
const playlist = readFileSync('./local/playlist.m3u', { encoding: 'utf-8' })
let { items } = parse(playlist)

iptvChecker(items, opts)
  .then(console.log.bind(console))
  .catch(console.error.bind(console))
```

## Usage

This module exports a single **asyncronous** function for processing the `items` array of an IPTV playlist parsed by the [iptv-playlist-parser](https://www.npmjs.com/package/iptv-playlist-parser) package. It will attempt to connect to each item's (i.e. channel's) URL, and adds a `status` object to the item with the results of said attempt.

### Parameters

The function accepts two parameter:

```javascript
iptvChecker((items = []), (options = {}))
```

#### Items (Array)

The `items` array of an IPTV playlist parsed by [iptv-playlist-parser](https://www.npmjs.com/package/iptv-playlist-parser).

```javascript
let { items } = require('iptv-playlist-parser').parse(somePlaylist)
```

#### Options (Object)

- `timeout`: Time (in ms) to wait for connection to an IPTV channel stream before considering the channel offline (default: `10000` )
- `parallel`: Number of channels to check concurrently (default: _`Available CPUs - 1`_)
- `userAgent`: User-Agent string to use when connecting to IPTV channel URLs (default: `undefined`)
- `debug`: Print additional progress and result information to the console (default: `false`)

```javascript
const iptvChecker = require("iptv-checker-module")
const { items } = require("iptv-playlist-parser").parse(somePlaylist)

const options = {
  timeout: 5e3,
  parallel: 2,
  userAgent: 'Mozilla/5.0 (compatible; Silly-Fetcher like kek) ROFLcopters',
  debug: true,
}

iptvChecker(items, options)
  .then(itemsWithStatus => /* do something with checked items */)
```

### Output

The function returns the same array of input `items`, but with each item having an additional `status` object containing its connection attempt result.

All `status` objects include an `ok: <Boolean>` property indicating if connection was successful or not.

#### Item Success

Successful connection attempts will include a `metadata` object containing `streams` and `format` details as returned by `ffprobe`

```javascript
itemsWithStatus = [
  // ...,
  {
    name: 'CGTN Documentary',
    tvg: {
      id: '',
      name: '',
      language: 'Chinese',
      country: 'CN',
      logo: 'https://i.imgur.com/TSG6WBy.png',
      url: '',
    },
    group: { title: 'Documentary' },
    url: 'https://news.cgtn.com/resource/live/document/cgtn-doc.m3u8',
    raw:
      '#EXTINF:-1 tvg-id="" tvg-name="" tvg-language="Chinese" tvg-logo="https://i.imgur.com/TSG6WBy.png" tvg-country="CN" tvg-url="" group-title="Documentary",CGTN Documentary\n' +
      'https://news.cgtn.com/resource/live/document/cgtn-doc.m3u8',
    status: {
      ok: true,
      metadata: {
        streams: [Array],
        format: [Object],
      },
    },
  },
  // ...
]
```

#### Item Failure

Failed connection attempts will include a `reason` property string detailing the cause of failure.

```javascript
itemsWithStatus = [
  // ...,
  {
    name: 'CGTN Documentary',
    tvg: {
      id: '',
      name: '',
      language: 'Chinese',
      country: 'CN',
      logo: 'https://i.imgur.com/TSG6WBy.png',
      url: '',
    },
    group: { title: 'Documentary' },
    url: 'https://news.cgtn.com/resource/live/document/cgtn-doc.m3u8',
    raw:
      '#EXTINF:-1 tvg-id="" tvg-name="" tvg-language="Chinese" tvg-logo="https://i.imgur.com/TSG6WBy.png" tvg-country="CN" tvg-url="" group-title="Documentary",CGTN Documentary\n' +
      'https://news.cgtn.com/resource/live/document/cgtn-doc.m3u8',
    status: {
      ok: false,
      reason: 'Timed out',
    },
  },
  // ...,
]
```

## Contribution

If you find a bug or want to contribute to the code or documentation, you can help by submitting an [issue](https://github.com/detroitenglish/iptv-checker-module/issues) or a [pull request](https://github.com/detroitenglish/iptv-checker-module/pulls).

## License

[MIT](http://opensource.org/licenses/MIT)
