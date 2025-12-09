import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

class WhatsAppService {
    private client: Client;
    private isReady: boolean = false;

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: process.env.WHATSAPP_AUTH_PATH || './.wwebjs_auth'
            }),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
        });

        this.initialize();
    }

    private initialize() {
        this.client.on('qr', (qr) => {
            console.log('QR RECEIVED', qr);
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('WhatsApp Client is ready!');
            this.isReady = true;
        });

        this.client.on('authenticated', () => {
            console.log('WhatsApp Authenticated');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('WhatsApp Authentication Failure', msg);
        });

        this.client.initialize();
    }

    public async sendMessage(groupId: string, message: string): Promise<void> {
        if (!this.isReady) {
            console.warn('WhatsApp client not ready yet. Queuing message? (Not implemented)');
            return;
        }
        try {
            // In whatsapp-web.js, group IDs usually end in @g.us
            const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
            await this.client.sendMessage(chatId, message);
            console.log(`Message sent to ${groupId}`);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    public async getGroups(): Promise<{ id: string; name: string }[]> {
        if (!this.isReady) return [];
        const chats = await this.client.getChats();
        return chats
            .filter((chat) => chat.isGroup)
            .map((chat) => ({
                id: chat.id._serialized,
                name: chat.name,
            }));
    }
}

export const whatsAppService = new WhatsAppService();
