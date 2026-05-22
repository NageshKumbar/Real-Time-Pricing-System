/**
 * Standalone feed viewer — connects to the external LiveFX feed directly.
 * Does NOT use the pricing engine and does NOT send a subscribe message.
 *
 * Usage (from Pricing_Engine folder):
 *   node test-feed-viewer.js
 *   SYMBOL=XAUUSD node test-feed-viewer.js
 *   MAX=20 node test-feed-viewer.js
 */
const WebSocket = require('ws');

const FEED_URL =
  process.env.FEED_URL ||
  'wss://quotes.livefxhub.com/?token=Lkj@asd@123&100';

const MAX_UPDATES = Number(process.env.MAX || 0);
const SYMBOL_FILTER = process.env.SYMBOL ? process.env.SYMBOL.toUpperCase() : null;

let printed = 0;

const ws = new WebSocket(FEED_URL);

ws.on('open', () => {
  console.log('Connected to live feed');
  console.log('No subscription required — printing market updates\n');
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());

    if (msg.type !== 'market_update' || !msg.data?.market_prices) {
      return;
    }

    for (const [symbol, price] of Object.entries(msg.data.market_prices)) {
      if (SYMBOL_FILTER && symbol !== SYMBOL_FILTER) continue;

      printed++;
      console.log(
        `#${printed}`,
        JSON.stringify(
          {
            symbol,
            buy: price.buy,
            sell: price.sell,
            change_24h: price.change_24h,
            high: price.high,
            low: price.low,
            time: msg.time,
          },
          null,
          2,
        ),
      );
      console.log('---');

      if (MAX_UPDATES > 0 && printed >= MAX_UPDATES) {
        console.log(`\nStopped after ${MAX_UPDATES} updates.`);
        ws.close();
        return;
      }
    }
  } catch (err) {
    console.error('Parse error:', err.message);
  }
});

ws.on('close', () => console.log('Disconnected'));
ws.on('error', (err) => console.error('Error:', err.message);
