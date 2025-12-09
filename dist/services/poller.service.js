"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollerService = exports.PollerService = exports.PlatformMonitor = void 0;
const client_1 = require("@prisma/client");
const queue_service_1 = require("./queue.service");
const storage_factory_1 = require("./storage.factory");
class PlatformMonitor {
}
exports.PlatformMonitor = PlatformMonitor;
// Mock Implementation for now
class MockInstagramMonitor extends PlatformMonitor {
    constructor() {
        super(...arguments);
        this.platform = client_1.Platform.INSTAGRAM;
    }
    async checkNewPosts(username, lastId) {
        if (Math.random() > 0.95) {
            const id = Date.now().toString();
            return [{
                    id,
                    platform: client_1.Platform.INSTAGRAM,
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
    constructor() {
        super(...arguments);
        this.platform = client_1.Platform.TWITTER;
    }
    async checkNewPosts(username, lastId) {
        if (Math.random() > 0.95) {
            const id = Date.now().toString();
            return [{
                    id,
                    platform: client_1.Platform.TWITTER,
                    content: `New tweet from ${username}!`,
                    url: `https://twitter.com/${username}/status/${id}`,
                    username,
                    timestamp: new Date(),
                }];
        }
        return [];
    }
}
class PollerService {
    constructor() {
        this.monitors = {
            [client_1.Platform.INSTAGRAM]: new MockInstagramMonitor(),
            [client_1.Platform.TWITTER]: new MockTwitterMonitor(),
        };
    }
    async startPolling() {
        console.log('Starting polling service...');
        this.poll();
        setInterval(() => this.poll(), 30000); // Poll every 30s
    }
    async poll() {
        try {
            const storage = await storage_factory_1.storageFactory.getStorage();
            const accounts = await storage.getMonitoredAccounts();
            for (const account of accounts) {
                const monitor = this.monitors[account.platform];
                if (monitor) {
                    const newPosts = await monitor.checkNewPosts(account.username, account.lastPostId || undefined);
                    for (const post of newPosts) {
                        console.log(`New post found for ${account.username}: ${post.id}`);
                        await queue_service_1.queueService.publish(post);
                        // Update DB
                        await storage.updateLastPostId(account.id, post.id);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in polling loop', error);
        }
    }
}
exports.PollerService = PollerService;
exports.pollerService = new PollerService();
