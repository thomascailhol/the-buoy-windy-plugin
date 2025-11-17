# The Buoy — Windy plugin

Windy plugin that plots The Buoy stations on the Windy map and shows the latest reading plus a last-6-hour sparkline. Powered by [The Buoy](https://labouee.app/).

## Develop

```bash
npm install
npm start    # dev server on https://localhost:9999
```

Load in Windy dev console:

```js
await import('https://localhost:9999/plugin.js');
```

Set your bearer API key inside the plugin panel (stored locally).

## Build

```bash
npm run build
```

Outputs to `dist/plugin.js` and `dist/plugin.min.js`.
