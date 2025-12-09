"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsAppService = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
class WhatsAppService {
    constructor() {
        this.isReady = false;
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth({
                dataPath: process.env.WHATSAPP_AUTH_PATH || './.wwebjs_auth'
            }),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
        });
        this.initialize();
    }
    initialize() {
        this.client.on('qr', (qr) => {
            console.log('QR RECEIVED', qr);
            qrcode_terminal_1.default.generate(qr, { small: true });
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
    async sendMessage(groupId, message) {
        if (!this.isReady) {
            console.warn('WhatsApp client not ready yet. Queuing message? (Not implemented)');
            return;
        }
        try {
            // In whatsapp-web.js, group IDs usually end in @g.us
            const chatId = groupId.includes('@') ? groupId : `${groupId}@g.us`;
            await this.client.sendMessage(chatId, message);
            console.log(`Message sent to ${groupId}`);
        }
        catch (error) {
            console.error('Error sending message:', error);
        }
    }
    async getGroups() {
        if (!this.isReady)
            return [];
        const chats = await this.client.getChats();
        return chats
            .filter((chat) => chat.isGroup)
            .map((chat) => ({
            id: chat.id._serialized,
            name: chat.name,
        }));
    }
}
exports.whatsAppService = new WhatsAppService();
