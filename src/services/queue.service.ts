import EventEmitter from 'events';
import amqp from 'amqplib';

const eventEmitter = new EventEmitter();

// Events
export const QUEUE_NAME = 'notifications';

export class QueueService {
    private channel: amqp.Channel | null = null;
    private useInMemory: boolean = process.env.USE_IN_MEMORY_QUEUE === 'true';

    constructor() {
        this.connect();
    }

    private async connect() {
        if (this.useInMemory) {
            console.log('Using In-Memory Queue (EventEmitter)');
            return;
        }

        try {
            const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await connection.createChannel();
            await this.channel.assertQueue(QUEUE_NAME, { durable: true });
            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ, falling back to In-Memory', error);
            this.useInMemory = true;
        }
    }

    public async publish(message: any) {
        if (this.useInMemory) {
            eventEmitter.emit(QUEUE_NAME, message);
        } else if (this.channel) {
            this.channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), { persistent: true });
        }
    }

    public async consume(callback: (msg: any) => Promise<void>) {
        if (this.useInMemory) {
            eventEmitter.on(QUEUE_NAME, async (msg) => {
                try {
                    await callback(msg);
                } catch (err) {
                    console.error('Error processing in-memory message', err);
                }
            });
        } else if (this.channel) {
            this.channel.consume(QUEUE_NAME, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await callback(content);
                        this.channel?.ack(msg);
                    } catch (err) {
                        console.error('Error processing RabbitMQ message', err);
                        this.channel?.nack(msg);
                    }
                }
            });
        }
    }
}

export const queueService = new QueueService();
