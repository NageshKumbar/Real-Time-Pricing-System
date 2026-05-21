import { Tick } from '../types';
import { CONFIG } from '../config';

export class RollingWindow {
    private data: Map<string, Tick[]> = new Map();

    addTick(tick: Tick) {
        if (!this.data.has(tick.symbol)) {
            this.data.set(tick.symbol, []);
        }

        const arr = this.data.get(tick.symbol)!;

        arr.push(tick);

        const cutoff = Date.now() - CONFIG.WINDOW_24H_MS;

        while (arr.length && arr[0].timestamp < cutoff) {
            arr.shift();
        }
    }

    getStats(symbol: string) {
        const arr = this.data.get(symbol) || [];

        if (!arr.length) {
            return null;
        }

        let high = -Infinity;
        let low = Infinity;

        for (const t of arr) {
            if (t.buy > high) high = t.buy;
            if (t.buy < low) low = t.buy;
        }

        const first = arr[0].buy;
        const latest = arr[arr.length - 1].buy;

        const change24h = ((latest - first) / first) * 100;

        return {
            high24h: high,
            low24h: low,
            change24h,
        };
    }
}