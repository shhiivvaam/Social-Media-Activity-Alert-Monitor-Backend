import { queueService } from './queue.service';
import { whatsAppService } from './whatsapp.service';
import { Platform } from '@prisma/client';
import { storageFactory } from './storage.factory';

export class ConsumerService {
    public async start() {
        console.log('Starting consumer service...');
        await queueService.consume(async (msg: any) => {
            console.log('Received message:', msg);
            await this.handleNotification(msg);
        });
    }

    private async handleNotification(post: any) {
        const platform = post.platform as Platform;
        const storage = await storageFactory.getStorage();

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
            await whatsAppService.sendMessage(group.groupId, messageBody);
        }
    }
}

export const consumerService = new ConsumerService();
