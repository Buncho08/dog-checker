import { test, expect } from '@playwright/test';

test('ボタンクリック時のレスポンス時間を詳細計測', async ({ page }) => {
    console.log('\n==================================================');
    console.log('  レスポンス時間の詳細計測');
    console.log('==================================================\n');

    // ネットワークリクエストを監視
    const apiRequests: any[] = [];

    page.on('request', request => {
        if (request.url().includes('tomapon55.net/api/') || request.url().includes('evaluate') || request.url().includes('animal')) {
            apiRequests.push({
                url: request.url(),
                method: request.method(),
                startTime: Date.now(),
            });
        }
    });

    page.on('response', response => {
        const request = apiRequests.find(r => r.url === response.url() && !r.endTime);
        if (request) {
            request.endTime = Date.now();
            request.duration = request.endTime - request.startTime;
            request.status = response.status();
        }
    });

    // ログイン
    console.log('ログイン中...');
    const loginStart = Date.now();
    await page.goto('https://tomapon55.net/login');
    await page.locator('input[type="password"]').fill('bansan');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('https://tomapon55.net/');
    const loginDuration = Date.now() - loginStart;
    console.log(`✓ ログイン完了: ${loginDuration}ms\n`);

    // ホームページの読み込み時間
    console.log('==================================================');
    console.log('  ホームページの読み込み時間');
    console.log('==================================================\n');

    const homeLoadStart = Date.now();
    await page.goto('https://tomapon55.net/');
    await page.waitForLoadState('networkidle');
    const homeLoadDuration = Date.now() - homeLoadStart;
    console.log(`ホームページ読み込み: ${homeLoadDuration}ms`);

    // 画像が読み込まれるまでの時間
    const imageLoadStart = Date.now();
    await page.waitForSelector('img', { state: 'visible', timeout: 10000 }).catch(() => null);
    const imageLoadDuration = Date.now() - imageLoadStart;
    console.log(`画像表示まで: ${imageLoadDuration}ms\n`);

    // 「いぬ」ボタンクリック時のレスポンス時間
    console.log('==================================================');
    console.log('  「いぬ」ボタンのレスポンス時間');
    console.log('==================================================\n');

    apiRequests.length = 0; // リセット

    const inuButton = page.getByRole('button', { name: /^いぬ$/i });
    await inuButton.waitFor({ state: 'visible' });

    const clickStart = Date.now();
    console.log('「いぬ」ボタンをクリック...');

    // レスポンスを待つPromiseを設定
    const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/') && response.status() !== 204,
        { timeout: 10000 }
    ).catch(() => null);

    await inuButton.click();

    const response = await responsePromise;
    const clickDuration = Date.now() - clickStart;

    console.log(`ボタンクリックからレスポンスまで: ${clickDuration}ms`);

    if (response) {
        console.log(`APIエンドポイント: ${response.url()}`);
        console.log(`ステータス: ${response.status()}`);
    }

    // モーダルやUI更新を待つ
    const uiUpdateStart = Date.now();
    await page.waitForTimeout(500); // UI更新を待つ
    const uiUpdateDuration = Date.now() - uiUpdateStart;

    console.log(`UI更新時間: ${uiUpdateDuration}ms`);
    console.log(`合計レスポンス時間: ${Date.now() - clickStart}ms\n`);

    // APIリクエストの詳細
    if (apiRequests.length > 0) {
        console.log('APIリクエスト詳細:');
        apiRequests.forEach((req, i) => {
            if (req.duration) {
                console.log(`  ${i + 1}. ${req.method} ${req.url}`);
                console.log(`     レスポンス時間: ${req.duration}ms (${req.status})`);
            }
        });
        console.log('');
    }

    // 「いぬじゃない」ボタンクリック時のレスポンス時間
    console.log('==================================================');
    console.log('  「いぬじゃない」ボタンのレスポンス時間');
    console.log('==================================================\n');

    // モーダルを閉じる
    const closeButton = page.locator('button:has-text("閉じる"), button:has-text("OK"), button:has-text("×")').first();
    if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(300);
    }

    apiRequests.length = 0;

    const notInuButton = page.getByRole('button', { name: /いぬじゃない/i });
    await notInuButton.waitFor({ state: 'visible' });

    const clickStart2 = Date.now();
    console.log('「いぬじゃない」ボタンをクリック...');

    const responsePromise2 = page.waitForResponse(
        response => response.url().includes('/api/') && response.status() !== 204,
        { timeout: 10000 }
    ).catch(() => null);

    await notInuButton.click();

    const response2 = await responsePromise2;
    const clickDuration2 = Date.now() - clickStart2;

    console.log(`ボタンクリックからレスポンスまで: ${clickDuration2}ms`);

    if (response2) {
        console.log(`APIエンドポイント: ${response2.url()}`);
        console.log(`ステータス: ${response2.status()}`);
    }

    console.log(`合計レスポンス時間: ${Date.now() - clickStart2}ms\n`);

    if (apiRequests.length > 0) {
        console.log('APIリクエスト詳細:');
        apiRequests.forEach((req, i) => {
            if (req.duration) {
                console.log(`  ${i + 1}. ${req.method} ${req.url}`);
                console.log(`     レスポンス時間: ${req.duration}ms (${req.status})`);
            }
        });
        console.log('');
    }

    // 「別の画像をみる」ボタンのレスポンス時間
    console.log('==================================================');
    console.log('  「別の画像をみる」ボタンのレスポンス時間');
    console.log('==================================================\n');

    // モーダルを閉じる
    const closeButton2 = page.locator('button:has-text("閉じる"), button:has-text("OK"), button:has-text("×")').first();
    if (await closeButton2.count() > 0) {
        await closeButton2.click();
        await page.waitForTimeout(300);
    }

    apiRequests.length = 0;

    const anotherButton = page.getByRole('button', { name: /別の画像/i });
    await anotherButton.waitFor({ state: 'visible' });

    const clickStart3 = Date.now();
    console.log('「別の画像をみる」ボタンをクリック...');

    const responsePromise3 = page.waitForResponse(
        response => response.url().includes('/api/') && response.status() !== 204,
        { timeout: 10000 }
    ).catch(() => null);

    await anotherButton.click();

    const response3 = await responsePromise3;
    const clickDuration3 = Date.now() - clickStart3;

    console.log(`ボタンクリックからレスポンスまで: ${clickDuration3}ms`);

    if (response3) {
        console.log(`APIエンドポイント: ${response3.url()}`);
        console.log(`ステータス: ${response3.status()}`);
    }

    console.log(`合計レスポンス時間: ${Date.now() - clickStart3}ms\n`);

    if (apiRequests.length > 0) {
        console.log('APIリクエスト詳細:');
        apiRequests.forEach((req, i) => {
            if (req.duration) {
                console.log(`  ${i + 1}. ${req.method} ${req.url}`);
                console.log(`     レスポンス時間: ${req.duration}ms (${req.status})`);
            }
        });
    }

    // パフォーマンスメトリクスを取得
    console.log('\n==================================================');
    console.log('  パフォーマンスサマリー');
    console.log('==================================================\n');

    const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            domInteractive: navigation.domInteractive,
            domComplete: navigation.domComplete,
        };
    });

    console.log('ナビゲーションタイミング:');
    console.log(`  DNS: ${performanceMetrics.dns.toFixed(2)}ms`);
    console.log(`  TCP: ${performanceMetrics.tcp.toFixed(2)}ms`);
    console.log(`  Request: ${performanceMetrics.request.toFixed(2)}ms`);
    console.log(`  Response: ${performanceMetrics.response.toFixed(2)}ms`);
    console.log(`  DOM Interactive: ${performanceMetrics.domInteractive.toFixed(2)}ms`);
    console.log(`  DOM Complete: ${performanceMetrics.domComplete.toFixed(2)}ms`);

    console.log('\n==================================================');
    console.log('  計測完了');
    console.log('==================================================\n');
});
