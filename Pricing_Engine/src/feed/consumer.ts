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

function normalizeTimestamp(time: number | undefined): number {
    if (time == null) return Date.now();
    // Feed sends unix seconds; rolling window uses ms
    return time < 1e12 ? time * 1000 : time;
}

function parseTicks(msg: any) {
    if (msg.type === 'market_update' && msg.data?.market_prices) {
        const timestamp = normalizeTimestamp(msg.time);

        return Object.entries(msg.data.market_prices).map(
            ([symbol, price]: [string, any]) => ({
                symbol,
                buy: Number(price.buy),
                sell: Number(price.sell),
                timestamp,
            }),
        );
    }

    if (msg.symbol) {
        return [
            {
                symbol: msg.symbol,
                buy: Number(msg.buy),
                sell: Number(msg.sell),
                timestamp: normalizeTimestamp(msg.timestamp),
            },
        ];
    }

    return [];
}

function connect() {
    const ws = new WebSocket(CONFIG.EXTERNAL_WS);

    ws.on('open', () => {
        console.log('Connected to external feed');
    });

    ws.on('message', raw => {
        try {
            const msg = JSON.parse(raw.toString());
            const ticks = parseTicks(msg);

            for (const tick of ticks) {
                const processed = processor.process(tick);
                const delta = encoder.encode(processed);
                broadcast(delta);
            }
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