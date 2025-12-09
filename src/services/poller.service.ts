import { Platform } from '@prisma/client';
import { queueService } from './queue.service';
import { storageFactory } from './storage.factory';
import { TwitterScraper } from './scraper/twitter.scraper';
import { InstagramScraper } from './scraper/instagram.scraper';

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

// Scraper Implementation
class InstagramMonitor extends PlatformMonitor {
    platform = Platform.INSTAGRAM;
    async checkNewPosts(username: string, lastId?: string): Promise<SocialMediaPost[]> {
        try {
            const post = await InstagramScraper.getLatestPost(username);

            // If no post found, or same as last processed, return empty
            if (!post || post.id === lastId) return [];

            console.log(`[Instagram] New post detected for ${username}: ${post.id}`);
            return [{
                ...post,
                platform: Platform.INSTAGRAM,
                username,
                // Ensure timestamp is Date, should be handled by scraper but safety check
                timestamp: post.timestamp || new Date()
            }];
        } catch (e) {
            console.error(`[Instagram] Failed to check for ${username}`, e);
            return [];
        }
    }
}

class TwitterMonitor extends PlatformMonitor {
    platform = Platform.TWITTER;
    async checkNewPosts(username: string, lastId?: string): Promise<SocialMediaPost[]> {
        try {
            const tweet = await TwitterScraper.getLatestTweet(username);

            // If no tweet found, or same as last processed, return empty
            if (!tweet || tweet.id === lastId) return [];

            console.log(`[Twitter] New tweet detected for ${username}: ${tweet.id}`);
            return [{
                ...tweet,
                platform: Platform.TWITTER,
                username,
                timestamp: tweet.timestamp || new Date()
            }];
        } catch (e) {
            console.error(`[Twitter] Failed to check for ${username}`, e);
            return [];
        }
    }
}

export class PollerService {
    private monitors: Record<Platform, PlatformMonitor>;

    constructor() {
        this.monitors = {
            [Platform.INSTAGRAM]: new InstagramMonitor(),
            [Platform.TWITTER]: new TwitterMonitor(),
        };
    }

    public async startPolling() {
        console.log('Starting scraping service (Interval: 60s)...');
        // Initial poll with delay to let server start
        setTimeout(() => this.poll(), 5000);

        // Increase interval to 60s to avoid rate limiting
        setInterval(() => this.poll(), 60000);
    }

    private async poll() {
        console.log('--- Polling Cycle Start ---');
        try {
            const storage = await storageFactory.getStorage();
            const accounts = await storage.getMonitoredAccounts();

            for (const account of accounts) {
                const monitor = this.monitors[account.platform];
                if (monitor) {
                    console.log(`Checking ${account.platform} for ${account.username}...`);
                    const newPosts = await monitor.checkNewPosts(account.username, account.lastPostId || undefined);

                    for (const post of newPosts) {
                        console.log(`Queueing notification for ${account.username}: ${post.id}`);
                        await queueService.publish(post);

                        // Update DB with new Last ID
                        await storage.updateLastPostId(account.id, post.id);
                    }
                }
            }
        } catch (error) {
            console.error('Error in polling loop', error);
        }
        console.log('--- Polling Cycle End ---');
    }
}

export const pollerService = new PollerService();
