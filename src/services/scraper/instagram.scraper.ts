
import { ScraperUtils } from './scraper.utils';
import { ScrapedPost } from './twitter.scraper';
import * as fs from 'fs';
import * as path from 'path';

export class InstagramScraper {
    static async getLatestPost(username: string): Promise<ScrapedPost | null> {
        const browser = await ScraperUtils.getBrowser();
        const page = await ScraperUtils.getPage(browser);

        // Try Picuki first
        try {
            const url = `https://www.picuki.com/profile/${username}`;
            console.log(`Scraping Instagram via ${url}...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            try {
                // Wait for content (Picuki might have cloudflare challenge or loading)
                await page.waitForSelector('.content-box .box-photos', { timeout: 10000 });
            } catch (e) {
                // Dump HTML
                const html = await page.content();
                fs.writeFileSync(path.join(process.cwd(), 'scraper_debug_instagram_picuki.html'), html);
                console.warn(`Timeout waiting for content on Picuki. Dumped HTML.`);
                throw new Error("Picuki Limit/Timeout");
            }

            const firstPostHandle = await page.$('.content-box .box-photos .box-photo');

            if (!firstPostHandle) {
                console.warn(`No posts found for ${username} on Picuki`);
                throw new Error("No posts on Picuki");
            }

            const postData = await page.evaluate((post) => {
                const linkEl = post.querySelector('a') as HTMLAnchorElement;
                const imgEl = post.querySelector('img') as HTMLImageElement;

                const href = linkEl?.getAttribute('href') || '';
                const id = href.split('/').pop();

                return {
                    id,
                    url: 'https://www.instagram.com/p/' + id,
                    imageUrl: imgEl?.src,
                    content: imgEl?.alt || 'New Instagram Post'
                };
            }, firstPostHandle);

            if (postData && postData.id) {
                await page.close();
                return {
                    id: postData.id,
                    content: postData.content,
                    url: postData.url,
                    timestamp: new Date(),
                    imageUrl: postData.imageUrl
                };
            }

        } catch (error) {
            console.warn(`Picuki failed for ${username}: ${error}`);
        }

        // Fallback: Imginn
        try {
            const url = `https://imginn.com/${username}/`;
            console.log(`Fallback: Scraping Instagram via ${url}...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            try {
                await page.waitForSelector('.items .item', { timeout: 10000 });
            } catch (e) {
                const html = await page.content();
                fs.writeFileSync(path.join(process.cwd(), 'scraper_debug_instagram_imginn.html'), html);
                console.warn(`Timeout waiting for content on Imginn. Dumped HTML.`);
                await page.close();
                return null;
            }

            const firstPostHandle = await page.$('.items .item');
            if (!firstPostHandle) {
                await page.close();
                return null;
            }

            const postData = await page.evaluate((post) => {
                const linkEl = post.querySelector('a') as HTMLAnchorElement;
                const imgEl = post.querySelector('img') as HTMLImageElement;

                // Imginn href is usually /p/{id}/
                const href = linkEl?.getAttribute('href') || '';
                const id = href.replace(/\/p\//g, '').replace(/\//g, '');

                return {
                    id,
                    url: 'https://www.instagram.com/p/' + id,
                    imageUrl: imgEl?.src,
                    content: imgEl?.alt || 'New Instagram Post'
                };
            }, firstPostHandle);

            await page.close();

            if (postData && postData.id) {
                return {
                    id: postData.id,
                    content: postData.content,
                    url: postData.url,
                    timestamp: new Date(),
                    imageUrl: postData.imageUrl
                };
            }

        } catch (error) {
            console.warn(`Imginn failed for ${username}: ${error}`);
            await page.close();
        }

        return null;
    }
}
