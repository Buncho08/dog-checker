import { test, chromium } from '@playwright/test';

test('Waterfall Analysis for tomapon55.net', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Performance.enable');

    const networkEvents: any[] = [];
    const startTimestamp = Date.now();

    // すべてのネットワークイベントを記録
    client.on('Network.requestWillBeSent', (params) => {
        networkEvents.push({
            type: 'requestWillBeSent',
            requestId: params.requestId,
            url: params.request.url,
            timestamp: params.timestamp,
            wallTime: params.wallTime,
        });
    });

    client.on('Network.responseReceived', (params) => {
        networkEvents.push({
            type: 'responseReceived',
            requestId: params.requestId,
            url: params.response.url,
            timestamp: params.timestamp,
            status: params.response.status,
            mimeType: params.response.mimeType,
            timing: params.response.timing,
            encodedDataLength: params.response.encodedDataLength,
        });
    });

    client.on('Network.loadingFinished', (params) => {
        networkEvents.push({
            type: 'loadingFinished',
            requestId: params.requestId,
            timestamp: params.timestamp,
            encodedDataLength: params.encodedDataLength,
        });
    });

    client.on('Network.loadingFailed', (params) => {
        networkEvents.push({
            type: 'loadingFailed',
            requestId: params.requestId,
            timestamp: params.timestamp,
            errorText: params.errorText,
        });
    });

    console.log('\n=== Starting Page Load ===\n');

    await page.goto('https://tomapon55.net/', {
        waitUntil: 'networkidle',
        timeout: 60000
    });

    // パフォーマンスメトリクスを取得
    const performanceMetrics = await client.send('Performance.getMetrics');

    console.log('=== Performance Metrics ===');
    performanceMetrics.metrics.forEach(metric => {
        console.log(`${metric.name}: ${metric.value}`);
    });

    // リクエストごとのタイミング分析
    const requestMap = new Map();

    networkEvents.forEach(event => {
        if (!requestMap.has(event.requestId)) {
            requestMap.set(event.requestId, {});
        }
        const req = requestMap.get(event.requestId);

        if (event.type === 'requestWillBeSent') {
            req.url = event.url;
            req.startTime = event.timestamp;
            req.wallTime = event.wallTime;
        } else if (event.type === 'responseReceived') {
            req.responseTime = event.timestamp;
            req.status = event.status;
            req.mimeType = event.mimeType;
            req.timing = event.timing;
            req.encodedDataLength = event.encodedDataLength;
        } else if (event.type === 'loadingFinished') {
            req.endTime = event.timestamp;
            req.finalSize = event.encodedDataLength;
        } else if (event.type === 'loadingFailed') {
            req.failed = true;
            req.errorText = event.errorText;
        }
    });

    console.log('\n=== Request Waterfall ===\n');

    const requests = Array.from(requestMap.values())
        .filter(r => r.url && r.startTime)
        .sort((a, b) => a.startTime - b.startTime);

    const baseTime = requests[0]?.startTime || 0;

    requests.forEach((req, index) => {
        const start = ((req.startTime - baseTime) * 1000).toFixed(0);
        const duration = req.endTime ? ((req.endTime - req.startTime) * 1000).toFixed(0) : 'N/A';
        const size = req.finalSize ? `${(req.finalSize / 1024).toFixed(2)}KB` : 'N/A';
        const status = req.failed ? 'FAILED' : (req.status || 'pending');

        console.log(`${index + 1}. [+${start}ms] [${duration}ms] [${status}] [${size}] ${req.mimeType || 'unknown'}`);
        console.log(`   ${req.url}`);

        if (req.timing) {
            const timing = req.timing;
            console.log(`   Timing: DNS=${timing.dnsEnd - timing.dnsStart}ms, ` +
                `Connect=${timing.connectEnd - timing.connectStart}ms, ` +
                `SSL=${timing.sslEnd - timing.sslStart}ms, ` +
                `Send=${timing.sendEnd - timing.sendStart}ms, ` +
                `Wait=${timing.receiveHeadersEnd - timing.sendEnd}ms`);
        }

        if (req.failed) {
            console.log(`   ERROR: ${req.errorText}`);
        }
        console.log('');
    });

    // 総ロード時間とサイズ
    const totalSize = requests.reduce((sum, r) => sum + (r.finalSize || 0), 0);
    const lastRequest = requests[requests.length - 1];
    const totalTime = lastRequest ? ((lastRequest.endTime - baseTime) * 1000).toFixed(0) : 'N/A';

    console.log('=== Summary ===');
    console.log(`Total Requests: ${requests.length}`);
    console.log(`Total Size: ${(totalSize / 1024).toFixed(2)}KB`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Failed Requests: ${requests.filter(r => r.failed).length}`);

    // 最も遅いリクエストを特定
    console.log('\n=== Slowest Requests ===');
    const slowest = requests
        .filter(r => r.endTime && r.startTime)
        .map(r => ({
            url: r.url,
            duration: (r.endTime - r.startTime) * 1000,
            size: r.finalSize,
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);

    slowest.forEach((req, i) => {
        console.log(`${i + 1}. ${req.duration.toFixed(0)}ms (${(req.size / 1024).toFixed(2)}KB) - ${req.url}`);
    });

    await browser.close();
});
