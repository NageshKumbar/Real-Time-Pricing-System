import WebSocket, { WebSocketServer } from 'ws';
import { CONFIG } from '../config';
import { SubscriptionManager } from './subscriptionManager';

export const subscriptionManager = new SubscriptionManager();

export const wss = new WebSocketServer({
    port: CONFIG.PORT,
});

wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', raw => {
        try {
            const msg = JSON.parse(raw.toString());

            if (msg.type === 'subscribe') {
                subscriptionManager.subscribe(ws, msg.symbols);
            }
        } catch (err) {
            console.error(err);
        }
    });

    ws.on('close', () => {
        subscriptionManager.unsubscribe(ws);
    });
});