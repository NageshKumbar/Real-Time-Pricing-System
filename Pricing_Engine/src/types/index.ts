export interface Tick {
    symbol: string;
    buy: number;
    sell: number;
    timestamp: number;
}

export interface ComputedMarketData {
    symbol: string;
    buy: number;
    sell: number;
    high24h: number;
    low24h: number;
    change24h: number;
    timestamp: number;
}