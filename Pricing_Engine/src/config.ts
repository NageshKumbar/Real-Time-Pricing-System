export const CONFIG = {
    EXTERNAL_WS:
        'wss://quotes.livefxhub.com/?token=Lkj@asd@123&100',

    PORT: 8080,

    REDIS_URL: 'redis://redis:6379',

    WINDOW_24H_MS: 24 * 60 * 60 * 1000,

    SNAPSHOT_INTERVAL_MS: 5000,

    MAX_CLIENT_PAYLOAD_BYTES: 10 * 1024,
};