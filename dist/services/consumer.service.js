"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumerService = exports.ConsumerService = void 0;
const queue_service_1 = require("./queue.service");
const whatsapp_service_1 = require("./whatsapp.service");
const storage_factory_1 = require("./storage.factory");
class ConsumerService {
    async start() {
        console.log('Starting consumer service...');
        await queue_service_1.queueService.consume(async (msg) => {
            console.log('Received message:', msg);
            await this.handleNotification(msg);
        });
    }
    async handleNotification(post) {
        const platform = post.platform;
        const storage = await storage_factory_1.storageFactory.getStorage();
        // Find groups for this platform using Storage
        const groups = await storage.getNotificationGroups(platform);
        if (groups.length === 0) {
            console.log(`No notification groups found for ${platform}`);
            return;
        }
        const messageBody = `🚨 *New ${platform} Post*\n\n` +
            `👤 *${post.username}*\n` +
            `📄 ${post.content}\n\n` +
            `🔗 ${post.url}\n` +
            `⏰ ${new Date(post.timestamp).toLocaleString()}`;
        for (const group of groups) {
            // Ensure group.groupId is a string
            console.log(`Sending notification to group: ${group.name} (${group.groupId})`);
            await whatsapp_service_1.whatsAppService.sendMessage(group.groupId, messageBody);
        }
    }
}
exports.ConsumerService = ConsumerService;
exports.consumerService = new ConsumerService();
