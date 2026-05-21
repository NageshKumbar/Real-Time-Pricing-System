import WebSocket from 'ws';
import { CONFIG } from '../config';
import { DeltaEncoder } from '../processor/deltaEncoder';
import { TickProcessor } from '../processor/tickProcessor';
import { subscriptionManager } from '../websocket/server';

const encoder = new DeltaEncoder();
const processor = new TickProcessor();

export function startConsumer() {
    connect();
}

function connect() {
    const ws = new WebSocket(CONFIG.EXTERNAL_WS);

    ws.on('open', () => {
        console.log('Connected to external feed');
    });

    ws.on('message', raw => {
        // console.log('RAW FEED:', raw.toString());

        try {
            const incoming = JSON.parse(raw.toString());

            const tick = {
                symbol: incoming.symbol,
                buy: incoming.buy,
                sell: incoming.sell,
                timestamp: incoming.timestamp,
            };

            const processed = processor.process(tick);

            const delta = encoder.encode(processed);

            broadcast(delta);
        } catch (err) {
            console.error(err);
        }
    });

    ws.on('close', () => {
        console.log('Feed disconnected, reconnecting...');

        setTimeout(connect, 2000);
    });

    ws.on('error', err => {
        console.error(err);
    });
}

function broadcast(data: any) {
    const clients = subscriptionManager.getClients(data.symbol);

    const payload = JSON.stringify(data);

    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    }
}