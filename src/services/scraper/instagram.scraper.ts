
import { ScraperUtils } from './scraper.utils';
import { ScrapedPost } from './twitter.scraper';

export class InstagramScraper {
    static async getLatestPost(username: string): Promise<ScrapedPost | null> {
        const browser = await ScraperUtils.getBrowser();
        const page = await ScraperUtils.getPage(browser);

        const url = `https://www.picuki.com/profile/${username}`;

        try {
            console.log(`Scraping Instagram via ${url}...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Picuki: .content-box > .box-photos > .box-photo (first one)
            const firstPostHandle = await page.$('.content-box .box-photos .box-photo');

            if (!firstPostHandle) {
                console.warn(`No posts found for ${username} on Picuki`);
                await page.close();
                return null;
            }

            const postData = await page.evaluate((post) => {
                const linkEl = post.querySelector('a') as HTMLAnchorElement;
                const imgEl = post.querySelector('img') as HTMLImageElement;
                // Picuki doesn't show full caption in list view often, but we can try to find alt text or visit detail
                // For speed, let's grab what we can from list view.

                // Usually Picuki doesn't expose ID cleanly in list view class, but it IS in the href: /media/{id}
                const href = linkEl?.getAttribute('href') || '';
                const id = href.split('/').pop();

                return {
                    id,
                    url: 'https://www.instagram.com/p/' + id, // Construct real IG link
                    imageUrl: imgEl?.src,
                    content: imgEl?.alt || 'New Instagram Post' // Fallback content
                };
            }, firstPostHandle);

            await page.close();

            if (!postData || !postData.id) return null;

            return {
                id: postData.id,
                content: postData.content,
                url: postData.url,
                timestamp: new Date(), // Picuki list view doesn't easily give exact timestamp, so we assume "Just Found"
                imageUrl: postData.imageUrl
            };

        } catch (error) {
            console.error(`Error scraping Instagram for ${username}:`, error);
            await page.close();
            return null;
        }
    }
}
