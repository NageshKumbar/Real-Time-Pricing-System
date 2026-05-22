/**
 * Pricing-engine viewer — subscribes to many symbols in one message.
 * (The engine only sends data after subscribe; this does not change server code.)
 *
 * Usage:
 *   node test-client-multi.js
 *   node test-client-multi.js BTCUSD XAUUSD EURUSD
 *   node test-client-multi.js BTCUSD,XAUUSD
 *
 * PowerShell env var:
 *   $env:SYMBOLS="BTCUSD,XAUUSD"; node test-client-multi.js
 */
const WebSocket = require('ws');

const URL = process.env.WS_URL || 'ws://localhost:8080';

const DEFAULT_SYMBOLS = [
  'BTCUSD',
  'XAUUSD',
  'XAGUSD',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'NAS100',
  'SPX500',
];

function resolveSymbols() {
  const args = process.argv.slice(2).filter(Boolean);
  if (args.length > 0) {
    return args
      .join(',')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (process.env.SYMBOLS) {
    return process.env.SYMBOLS.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_SYMBOLS;
}

const symbols = resolveSymbols();

const ws = new WebSocket(URL);

ws.on('open', () => {
  console.log(`Connected to ${URL}`);
  ws.send(JSON.stringify({ type: 'subscribe', symbols }));
  console.log('Subscribed to:', symbols.join(', '), '\n');

  setTimeout(() => {
    if (printed === 0) {
      console.log(
        'No data yet. Is the server running? Restart after code changes:\n' +
          '  npm run dev   OR   docker compose up --build',
      );
    }
  }, 5000);
});

let printed = 0;

ws.on('message', (data) => {
  printed++;
  console.log('Received:', data.toString());
});

ws.on('close', () => console.log('Disconnected'));
ws.on('error', (err) => console.error('Error:', err.message));
