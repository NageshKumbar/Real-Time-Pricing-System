import { ComputedMarketData } from '../types';

export class DeltaEncoder {
    private previous = new Map<string, ComputedMarketData>();

    encode(current: ComputedMarketData) {
        const prev = this.previous.get(current.symbol);

        if (!prev) {
            this.previous.set(current.symbol, current);
            return current;
        }

        const delta: any = {
            symbol: current.symbol,
            timestamp: current.timestamp,
        };

        for (const key of Object.keys(current)) {
            if ((current as any)[key] !== (prev as any)[key]) {
                delta[key] = (current as any)[key];
            }
        }

        this.previous.set(current.symbol, current);

        return delta;
    }
}