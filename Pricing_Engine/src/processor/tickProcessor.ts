import { Tick, ComputedMarketData } from '../types';
import { RollingWindow } from './rollingWindow';

export class TickProcessor {
    private rolling = new RollingWindow();

    process(tick: Tick): ComputedMarketData {
        this.rolling.addTick(tick);

        const stats = this.rolling.getStats(tick.symbol);

        return {
            symbol: tick.symbol,
            buy: tick.buy,
            sell: tick.sell,
            high24h: stats?.high24h ?? tick.buy,
            low24h: stats?.low24h ?? tick.buy,
            change24h: stats?.change24h ?? 0,
            timestamp: tick.timestamp,
        };
    }
}