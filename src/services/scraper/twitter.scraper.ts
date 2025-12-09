
import { ScraperUtils } from './scraper.utils';

export interface ScrapedPost {
    id: string;
    content: string;
    url: string;
    timestamp: Date;
    imageUrl?: string;
}

export class TwitterScraper {
    private static NITTER_INSTANCES = [
        'https://nitter.net',
        'https://nitter.cz',
        'https://nitter.io'
    ];

    static async getLatestTweet(username: string): Promise<ScrapedPost | null> {
        const browser = await ScraperUtils.getBrowser();
        const page = await ScraperUtils.getPage(browser);

        // Randomly select a Nitter instance to distribute load
        const instance = this.NITTER_INSTANCES[Math.floor(Math.random() * this.NITTER_INSTANCES.length)];
        const url = `${instance}/${username}`;

        try {
            console.log(`Scraping Twitter via ${url}...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Check if profile exists
            const notFound = await page.$('.error-panel');
            if (notFound) {
                console.warn(`Twitter profile ${username} not found on ${instance}`);
                return null;
            }

            // Nitter structure: .timeline > .timeline-item > .tweet-body
            // We want the pinned tweet OR the first regular tweet.
            // .pinned class exists for pinned tweets.

            // Selector for the first item in the timeline that is a tweet
            const firstTweetHandle = await page.$('.timeline .timeline-item:not(.show-more)');

            if (!firstTweetHandle) return null;

            const tweetData = await page.evaluate((tweet) => {
                const linkEl = tweet.querySelector('.tweet-link') as HTMLAnchorElement;
                const contentEl = tweet.querySelector('.tweet-content');
                const dateEl = tweet.querySelector('.tweet-date a') as HTMLAnchorElement;
                const imgEl = tweet.querySelector('.attachment.image img') as HTMLImageElement;

                if (!linkEl || !contentEl) return null;

                // ID is last part of href
                const href = linkEl.getAttribute('href') || '';
                const id = href.split('/').pop()?.split('#')[0] || '';

                return {
                    id,
                    content: contentEl.textContent || '',
                    url: linkEl.href, // This will be the full Nitter URL, we might want to convert to twitter.com or just keep it
                    timestamp: dateEl ? dateEl.getAttribute('title') : null, // Nitter usually puts exact date in title
                    imageUrl: imgEl ? imgEl.src : undefined
                };
            }, firstTweetHandle);

            await page.close();

            if (!tweetData) return null;

            // Convert Nitter URL to Twitter URL for the notification
            const realUrl = tweetData.url.replace(new URL(tweetData.url).hostname, 'twitter.com');

            return {
                id: tweetData.id,
                content: tweetData.content,
                url: realUrl,
                timestamp: tweetData.timestamp ? new Date(tweetData.timestamp) : new Date(), // Fallback to now if parsing fails
                imageUrl: tweetData.imageUrl
            };

        } catch (error) {
            console.error(`Error scraping Twitter for ${username}:`, error);
            await page.close();
            return null;
        }
    }
}
