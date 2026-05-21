import './websocket/server';
import { startConsumer } from './feed/consumer';

console.log('Pricing engine started');

startConsumer();