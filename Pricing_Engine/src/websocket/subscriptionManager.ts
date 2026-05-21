import WebSocket from 'ws';

export class SubscriptionManager {
    private subscriptions = new Map<WebSocket, Set<string>>();

    subscribe(ws: WebSocket, symbols: string[]) {

        console.log('Subscribed symbols:', symbols);
    
        this.subscriptions.set(ws, new Set(symbols));
    }

    unsubscribe(ws: WebSocket) {
        this.subscriptions.delete(ws);
    }

    getClients(symbol: string): WebSocket[] {
        const clients: WebSocket[] = [];

        for (const [ws, symbols] of this.subscriptions.entries()) {
            if (symbols.has(symbol)) {
                clients.push(ws);
            }
        }

        return clients;
    }
}