
import { ScraperUtils } from './scraper.utils';
import * as fs from 'fs';
import * as path from 'path';

export interface ScrapedPost {
    id: string;
    content: string;
    url: string;
    timestamp: Date;
    imageUrl?: string;
}

export class TwitterScraper {
    private static NITTER_INSTANCES = [
        'https://nitter.cz',
        'https://nitter.poast.org',
        'https://nitter.privacydev.net',
        'https://nitter.projectsegfau.lt'
    ];

    static async getLatestTweet(username: string): Promise<ScrapedPost | null> {
        const browser = await ScraperUtils.getBrowser();
        const page = await ScraperUtils.getPage(browser);

        // Shuffle instances to distribute load, but try all of them if needed
        const instances = [...this.NITTER_INSTANCES].sort(() => Math.random() - 0.5);

        for (const instance of instances) {
            const url = `${instance}/${username}`;
            try {
                console.log(`Scraping Twitter via ${url}...`);
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                // Check for generic error
                const errorPanel = await page.$('.error-panel');
                if (errorPanel) {
                    console.warn(`Twitter profile ${username} not found/error on ${instance}`);
                    continue;
                }

                // Wait for timeline (handles "Anubis" protection loading screen)
                try {
                    await page.waitForSelector('.timeline .timeline-item', { timeout: 15000 });
                } catch (e) {
                    console.warn(`Timeout waiting for timeline on ${instance}. Dumping HTML...`);
                    const html = await page.content();
                    fs.writeFileSync(path.join(process.cwd(), 'scraper_debug_twitter.html'), html);
                    continue;
                }

                const firstTweetHandle = await page.$('.timeline .timeline-item:not(.show-more)');
                if (!firstTweetHandle) {
                    // Try to see if it's because of a "Sensitive Content" warning or "Protected"
                    const content = await page.content();
                    if (content.includes('Restricted')) {
                        console.warn(`Account ${username} is restricted/sensitive on ${instance}`);
                    } else {
                        console.warn(`No tweets found for ${username} on ${instance}`);
                    }
                    continue; // Try next instance
                }

                const tweetData = await page.evaluate((tweet) => {
                    const linkEl = tweet.querySelector('.tweet-link') as HTMLAnchorElement;
                    const contentEl = tweet.querySelector('.tweet-content');
                    const dateEl = tweet.querySelector('.tweet-date a') as HTMLAnchorElement;
                    const imgEl = tweet.querySelector('.attachment.image img') as HTMLImageElement;

                    if (!linkEl || !contentEl) return null;

                    const href = linkEl.getAttribute('href') || '';
                    const id = href.split('/').pop()?.split('#')[0] || '';

                    return {
                        id,
                        content: contentEl.textContent || '',
                        url: linkEl.href,
                        timestamp: dateEl ? dateEl.getAttribute('title') : null,
                        imageUrl: imgEl ? imgEl.src : undefined
                    };
                }, firstTweetHandle);

                if (!tweetData) continue; // Should have data if handle existed

                await page.close();

                // Success! Return data.
                const realUrl = tweetData.url.replace(new URL(tweetData.url).hostname, 'twitter.com');
                return {
                    id: tweetData.id,
                    content: tweetData.content,
                    url: realUrl,
                    timestamp: tweetData.timestamp ? new Date(tweetData.timestamp) : new Date(),
                    imageUrl: tweetData.imageUrl
                };

            } catch (error) {
                console.warn(`Failed to scrape ${instance} for ${username}: ${error}`);
                // Continue to next instance
            }
        }

        // All instances failed
        await page.close();
        return null;
    }
}
