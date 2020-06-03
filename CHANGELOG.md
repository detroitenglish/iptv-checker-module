# Change Log

## 2.0.0

- Add `useItemHttpHeaders` option (default: `true`). If defined in a `#EXTVLCOPT` tag, an items's specified `Referer` and/or `User-Agent` properties will included as parameters in the `ffprobe` check.

- Items are given a temporary unique ID for `debug` console logging, improving log readability when `parallel` > 1.
