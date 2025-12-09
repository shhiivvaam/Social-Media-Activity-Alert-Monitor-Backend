import { Platform } from '@prisma/client';
import { queueService } from './queue.service';
import { storageFactory } from './storage.factory';

interface SocialMediaPost {
    id: string;
    platform: Platform;
    content: string;
    url: string;
    username: string;
    imageUrl?: string;
    timestamp: Date;
}

export abstract class PlatformMonitor {
    abstract platform: Platform;
    abstract checkNewPosts(username: string, lastId?: string): Promise<SocialMediaPost[]>;
}

// Mock Implementation for now
class MockInstagramMonitor extends PlatformMonitor {
    platform = Platform.INSTAGRAM;
    async checkNewPosts(username: string, lastId?: string): Promise<SocialMediaPost[]> {
        if (Math.random() > 0.95) {
            const id = Date.now().toString();
            return [{
                id,
                platform: Platform.INSTAGRAM,
                content: `New post from ${username}!`,
                url: `https://instagram.com/p/${id}`,
                username,
                timestamp: new Date(),
            }];
        }
        return [];
    }
}

class MockTwitterMonitor extends PlatformMonitor {
    platform = Platform.TWITTER;
    async checkNewPosts(username: string, lastId?: string): Promise<SocialMediaPost[]> {
        if (Math.random() > 0.95) {
            const id = Date.now().toString();
            return [{
                id,
                platform: Platform.TWITTER,
                content: `New tweet from ${username}!`,
                url: `https://twitter.com/${username}/status/${id}`,
                username,
                timestamp: new Date(),
            }];
        }
        return [];
    }
}

export class PollerService {
    private monitors: Record<Platform, PlatformMonitor>;

    constructor() {
        this.monitors = {
            [Platform.INSTAGRAM]: new MockInstagramMonitor(),
            [Platform.TWITTER]: new MockTwitterMonitor(),
        };
    }

    public async startPolling() {
        console.log('Starting polling service...');
        this.poll();
        setInterval(() => this.poll(), 30000); // Poll every 30s
    }

    private async poll() {
        try {
            const storage = await storageFactory.getStorage();
            const accounts = await storage.getMonitoredAccounts();

            for (const account of accounts) {
                const monitor = this.monitors[account.platform];
                if (monitor) {
                    const newPosts = await monitor.checkNewPosts(account.username, account.lastPostId || undefined);
                    for (const post of newPosts) {
                        console.log(`New post found for ${account.username}: ${post.id}`);
                        await queueService.publish(post);

                        // Update DB
                        await storage.updateLastPostId(account.id, post.id);
                    }
                }
            }
        } catch (error) {
            console.error('Error in polling loop', error);
        }
    }
}

export const pollerService = new PollerService();
