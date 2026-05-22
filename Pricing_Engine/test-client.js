const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to pricing engine');

  ws.send(
    JSON.stringify({
      type: 'subscribe',
      symbols: ['BTCUSD']
    })
  );
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('close', () => {
  console.log('Disconnected');
});
ws.on('error', (err) => {
  console.error('Error:', err);
});
