# IPTV Checker Module

A module for validating IPTV channel links in `.m3u` playlists.

## Requirements

**This tool requires the `ffmpeg` library, so you need to have it installed on your device.**

You can find the right [installer for your system here](https://www.ffmpeg.org/download.html).

## Example

```javascript
const { readFileSync } = require('fs')
const iptvChecker = require('iptv-checker-module')

const opts = {
  timeout: 5000,
  parallel: 2,
}

// Example with path to local playlist file
iptvChecker('/home/foo/playlist.m3u', opts)

// Example with playlist URL
iptvChecker('http://127.0.0.1/example/playlist.m3u', opts)

// Example with playlist data Buffer
const playlistBuffer = readFileSync('/home/foo/playlist.m3u')
iptvChecker(playlistBuffer, opts)
```

## Usage

```javascript
iptvChecker(input, [(options = {})])
```

This module exports a single **asyncronous** function for parsing one of the following inputs:

1. Path to a local `.m3u` playlist file (_String_)
2. URL of an `.m3u` playlist (_String_)
3. `.m3u` file data (_String_ or _Buffer_)

...using the [iptv-playlist-parser](https://www.npmjs.com/package/iptv-playlist-parser) package.

It will attempt to connect to each item's (i.e. channel's) URL, and adds a `status` object to the item with the results of said attempt.

### Options (Object)

- `timeout`: Time (in ms) to wait for connection to an IPTV channel stream before considering the channel offline (default: `10000` )
- `parallel`: Number of channels to check concurrently (default: _`Available CPUs - 1`_)
- `userAgent`: User-Agent string to use when connecting to IPTV channel URLs (default: `undefined`)
- `debug`: Print additional progress and result information to the console (default: `false`)
- `omitMetadata`: Omit the `metadata` field from the `status` object of successful connections (default: `false`)

```javascript
const iptvChecker = require("iptv-checker-module")

const options = {
  timeout: 5e3,
  parallel: 2,
  userAgent: 'Mozilla/5.0 (compatible; Silly-Fetcher like kek) ROFLcopters',
  debug: true,
  omitMetadata: true,
}

iptvChecker('./local/playlist.m3u', options)
  .then(checkedPlaylist => /* ip-tv-playlist Object */)
```

### Output

The function returns the [iptv-playlist-parser](https://www.npmjs.com/package/iptv-playlist-parser) object, with each `item` having an additional `status` object with its connection attempt result.

All `status` objects include an `ok: <Boolean>` property indicating if connection was successful or not.

#### Item Success

Unless omitted in options, items' `status` with successful connection attempts will include a `metadata` object containing `streams` and `format` data returned by `ffprobe`

```javascript
{
  header: {
    attrs: {
      'x-tvg-url': 'http://example.com/epg.xml.gz'
    },
    raw: '#EXTM3U x-tvg-url="http://example.com/epg.xml.gz"'
  },
  items: [
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
        }
      }
    }
  ]
}
```

#### Item Failure

Items' `status` with a failed connection attempt will include a `reason` property string detailing the cause of failure.

```javascript
{
  header: {
    attrs: {
      'x-tvg-url': 'http://example.com/epg.xml.gz'
    },
    raw: '#EXTM3U x-tvg-url="http://example.com/epg.xml.gz"'
  },
  items: [
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
        reason: 'Timed out'
      }
    }
  ]
}
```

## Contribution

If you find a bug or want to contribute to the code or documentation, you can help by submitting an [issue](https://github.com/detroitenglish/iptv-checker-module/issues) or a [pull request](https://github.com/detroitenglish/iptv-checker-module/pulls).

## License

[MIT](http://opensource.org/licenses/MIT)
