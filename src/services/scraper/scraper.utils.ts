
import puppeteer, { Browser, Page } from 'puppeteer';

export class ScraperUtils {
    private static browser: Browser | null = null;

    static async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            console.log('Launching Polling Browser...');
            this.browser = await puppeteer.launch({
                headless: "new" as any, // Use new headless mode
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    static async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    static async getPage(browser: Browser): Promise<Page> {
        const page = await browser.newPage();
        // Set a generic User Agent to avoid immediate blocking
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        return page;
    }
}
