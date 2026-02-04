import { test, expect, chromium } from '@playwright/test';

test.describe('Detailed Performance Analysis for tomapon55.net', () => {
    test('analyze with network throttling and detailed metrics', async () => {
        // ブラウザを手動で起動してCDPセッションを使用
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();

        // CDP セッションを取得
        const client = await context.newCDPSession(page);

        // ネットワークとCPUのスロットリングを有効化（3G Fast相当）
        await client.send('Network.enable');
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
            uploadThroughput: (750 * 1024) / 8, // 750 kbps
            latency: 150, // 150ms
        });

        // リクエストとレスポンスをキャプチャ
        const requests: any[] = [];
        const responses: any[] = [];

        client.on('Network.requestWillBeSent', (params) => {
            requests.push({
                url: params.request.url,
                method: params.request.method,
                timestamp: params.timestamp,
                requestId: params.requestId,
            });
        });

        client.on('Network.responseReceived', (params) => {
            responses.push({
                url: params.response.url,
                status: params.response.status,
                mimeType: params.response.mimeType,
                timestamp: params.timestamp,
                requestId: params.requestId,
                headers: params.response.headers,
                encodedDataLength: params.response.encodedDataLength,
            });
        });

        console.log('\n=== Testing with Network Throttling (3G Fast) ===\n');

        const startTime = Date.now();
        await page.goto('https://tomapon55.net/', {
            waitUntil: 'networkidle',
            timeout: 120000
        });
        const loadTime = Date.now() - startTime;

        console.log(`Total Load Time with Throttling: ${loadTime}ms\n`);

        // レスポンスの詳細分析
        console.log('=== Response Analysis ===');
        responses.forEach((resp, i) => {
            const size = resp.encodedDataLength ? `${(resp.encodedDataLength / 1024).toFixed(2)}KB` : 'N/A';
            console.log(`${i + 1}. [${resp.status}] ${resp.mimeType} (${size}) - ${resp.url}`);
        });

        // キャッシュヘッダーの確認
        console.log('\n=== Cache Headers Analysis ===');
        responses.forEach((resp) => {
            const cacheControl = resp.headers['cache-control'] || resp.headers['Cache-Control'];
            const etag = resp.headers['etag'] || resp.headers['ETag'];
            if (cacheControl || etag) {
                console.log(`${resp.url}`);
                if (cacheControl) console.log(`  Cache-Control: ${cacheControl}`);
                if (etag) console.log(`  ETag: ${etag}`);
            }
        });

        await browser.close();
    });

    test('analyze without throttling for comparison', async ({ page }) => {
        console.log('\n=== Testing without Network Throttling ===\n');

        // CDPセッションを取得してキャッシュをクリア
        const client = await page.context().newCDPSession(page);
        await client.send('Network.clearBrowserCache');
        await client.send('Network.setCacheDisabled', { cacheDisabled: true });

        const startTime = Date.now();
        await page.goto('https://tomapon55.net/', {
            waitUntil: 'networkidle',
            timeout: 60000
        });
        const loadTime = Date.now() - startTime;

        console.log(`Total Load Time without Throttling (no cache): ${loadTime}ms\n`);

        // DOMサイズの確認
        const domStats = await page.evaluate(() => {
            const all = document.querySelectorAll('*');
            const scripts = document.querySelectorAll('script');
            const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
            const images = document.querySelectorAll('img');

            return {
                totalElements: all.length,
                scripts: scripts.length,
                styles: styles.length,
                images: images.length,
                bodySize: document.body.innerHTML.length,
            };
        });

        console.log('=== DOM Statistics ===');
        console.log(`Total Elements: ${domStats.totalElements}`);
        console.log(`Scripts: ${domStats.scripts}`);
        console.log(`Stylesheets: ${domStats.styles}`);
        console.log(`Images: ${domStats.images}`);
        console.log(`Body HTML Size: ${(domStats.bodySize / 1024).toFixed(2)}KB`);

        // JavaScriptのエラーをチェック
        const jsErrors: string[] = [];
        page.on('pageerror', (error) => {
            jsErrors.push(error.message);
        });

        if (jsErrors.length > 0) {
            console.log('\n=== JavaScript Errors ===');
            jsErrors.forEach((error, i) => {
                console.log(`${i + 1}. ${error}`);
            });
        }
    });
});
