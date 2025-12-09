"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.QueueService = exports.QUEUE_NAME = void 0;
const events_1 = __importDefault(require("events"));
const amqplib_1 = __importDefault(require("amqplib"));
const eventEmitter = new events_1.default();
// Events
exports.QUEUE_NAME = 'notifications';
class QueueService {
    constructor() {
        this.channel = null;
        this.useInMemory = process.env.USE_IN_MEMORY_QUEUE === 'true';
        this.connect();
    }
    async connect() {
        if (this.useInMemory) {
            console.log('Using In-Memory Queue (EventEmitter)');
            return;
        }
        try {
            const connection = await amqplib_1.default.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await connection.createChannel();
            await this.channel.assertQueue(exports.QUEUE_NAME, { durable: true });
            console.log('Connected to RabbitMQ');
        }
        catch (error) {
            console.error('Failed to connect to RabbitMQ, falling back to In-Memory', error);
            this.useInMemory = true;
        }
    }
    async publish(message) {
        if (this.useInMemory) {
            eventEmitter.emit(exports.QUEUE_NAME, message);
        }
        else if (this.channel) {
            this.channel.sendToQueue(exports.QUEUE_NAME, Buffer.from(JSON.stringify(message)), { persistent: true });
        }
    }
    async consume(callback) {
        if (this.useInMemory) {
            eventEmitter.on(exports.QUEUE_NAME, async (msg) => {
                try {
                    await callback(msg);
                }
                catch (err) {
                    console.error('Error processing in-memory message', err);
                }
            });
        }
        else if (this.channel) {
            this.channel.consume(exports.QUEUE_NAME, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await callback(content);
                        this.channel?.ack(msg);
                    }
                    catch (err) {
                        console.error('Error processing RabbitMQ message', err);
                        this.channel?.nack(msg);
                    }
                }
            });
        }
    }
}
exports.QueueService = QueueService;
exports.queueService = new QueueService();
