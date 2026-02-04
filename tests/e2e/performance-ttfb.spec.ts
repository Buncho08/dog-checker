import { test, chromium } from '@playwright/test';

test('TTFB and Server Response Analysis', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const client = await context.newCDPSession(page);
    await client.send('Network.enable');

    const timingData: any = {};

    client.on('Network.responseReceived', (params) => {
        if (params.response.url.includes('tomapon55.net')) {
            const timing = params.response.timing;
            if (timing) {
                timingData[params.response.url] = {
                    url: params.response.url,
                    status: params.response.status,
                    remoteIPAddress: params.response.remoteIPAddress,
                    remotePort: params.response.remotePort,
                    fromDiskCache: params.response.fromDiskCache,
                    fromServiceWorker: params.response.fromServiceWorker,
                    timing: {
                        requestTime: timing.requestTime,
                        proxyStart: timing.proxyStart,
                        proxyEnd: timing.proxyEnd,
                        dnsStart: timing.dnsStart,
                        dnsEnd: timing.dnsEnd,
                        connectStart: timing.connectStart,
                        connectEnd: timing.connectEnd,
                        sslStart: timing.sslStart,
                        sslEnd: timing.sslEnd,
                        workerStart: timing.workerStart,
                        workerReady: timing.workerReady,
                        workerFetchStart: timing.workerFetchStart,
                        workerRespondWithSettled: timing.workerRespondWithSettled,
                        sendStart: timing.sendStart,
                        sendEnd: timing.sendEnd,
                        pushStart: timing.pushStart,
                        pushEnd: timing.pushEnd,
                        receiveHeadersEnd: timing.receiveHeadersEnd,
                    },
                    headers: params.response.headers,
                };
            }
        }
    });

    console.log('\n=== Loading Page (Fresh, No Cache) ===\n');

    // キャッシュをクリア
    await client.send('Network.clearBrowserCache');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });

    const start = Date.now();
    await page.goto('https://tomapon55.net/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });
    const domContentLoaded = Date.now() - start;

    await page.waitForLoadState('networkidle', { timeout: 60000 });
    const networkIdle = Date.now() - start;

    console.log(`DOMContentLoaded: ${domContentLoaded}ms`);
    console.log(`Network Idle: ${networkIdle}ms\n`);

    console.log('=== Detailed Timing Breakdown ===\n');

    Object.values(timingData).forEach((data: any) => {
        const t = data.timing;

        // TTFB計算 (Time To First Byte)
        const ttfb = (t.receiveHeadersEnd - t.sendStart) * 1000;
        const dns = (t.dnsEnd - t.dnsStart) * 1000;
        const tcp = (t.connectEnd - t.connectStart) * 1000;
        const ssl = t.sslStart !== -1 ? (t.sslEnd - t.sslStart) * 1000 : 0;
        const request = (t.sendEnd - t.sendStart) * 1000;
        const waiting = (t.receiveHeadersEnd - t.sendEnd) * 1000;

        console.log(`URL: ${data.url}`);
        console.log(`  Status: ${data.status}`);
        console.log(`  Server: ${data.remoteIPAddress}:${data.remotePort}`);
        console.log(`  From Cache: ${data.fromDiskCache ? 'Yes' : 'No'}`);
        console.log(`  TTFB: ${ttfb.toFixed(2)}ms`);
        console.log(`  Breakdown:`);
        if (dns > 0) console.log(`    - DNS Lookup: ${dns.toFixed(2)}ms`);
        if (tcp > 0) console.log(`    - TCP Connection: ${tcp.toFixed(2)}ms`);
        if (ssl > 0) console.log(`    - SSL/TLS: ${ssl.toFixed(2)}ms`);
        console.log(`    - Request Sent: ${request.toFixed(2)}ms`);
        console.log(`    - Waiting (Server Processing): ${waiting.toFixed(2)}ms`);

        // サーバーヘッダーの確認
        const serverHeader = data.headers['server'] || data.headers['Server'];
        const cfCacheStatus = data.headers['cf-cache-status'];
        const cfRay = data.headers['cf-ray'];
        const xPoweredBy = data.headers['x-powered-by'] || data.headers['X-Powered-By'];

        if (serverHeader) console.log(`  Server Software: ${serverHeader}`);
        if (cfCacheStatus) console.log(`  Cloudflare Cache Status: ${cfCacheStatus}`);
        if (cfRay) console.log(`  Cloudflare Ray ID: ${cfRay}`);
        if (xPoweredBy) console.log(`  Powered By: ${xPoweredBy}`);

        console.log('');
    });

    // 複数回アクセスしてサーバーレスポンスの一貫性をチェック
    console.log('=== Testing Response Time Consistency (5 requests) ===\n');

    const responseTimes: number[] = [];

    for (let i = 0; i < 5; i++) {
        await client.send('Network.clearBrowserCache');
        const requestStart = Date.now();

        await page.goto('https://tomapon55.net/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const requestTime = Date.now() - requestStart;
        responseTimes.push(requestTime);
        console.log(`Request ${i + 1}: ${requestTime}ms`);

        // 少し待つ
        await page.waitForTimeout(500);
    }

    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);
    const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);

    console.log(`\nAverage: ${avgTime.toFixed(2)}ms`);
    console.log(`Min: ${minTime}ms`);
    console.log(`Max: ${maxTime}ms`);
    console.log(`Standard Deviation: ${stdDev.toFixed(2)}ms`);

    // キャッシュありでの読み込み
    console.log('\n=== Testing with Cache Enabled ===\n');

    await client.send('Network.setCacheDisabled', { cacheDisabled: false });

    const cachedStart = Date.now();
    await page.goto('https://tomapon55.net/', {
        waitUntil: 'networkidle',
        timeout: 60000
    });
    const cachedTime = Date.now() - cachedStart;

    console.log(`Load Time with Cache: ${cachedTime}ms`);
    console.log(`Improvement: ${((1 - cachedTime / avgTime) * 100).toFixed(1)}% faster`);

    await browser.close();
});
