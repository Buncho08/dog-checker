import { test, expect } from '@playwright/test';

test.describe('Performance Analysis for tomapon55.net', () => {
    test('analyze page load performance', async ({ page }) => {
        // Performance metrics を収集
        const startTime = Date.now();

        // ページにアクセス
        await page.goto('https://tomapon55.net/', {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        const loadTime = Date.now() - startTime;
        console.log(`\n=== Total Load Time: ${loadTime}ms ===\n`);

        // Performance API からメトリクスを取得
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const paint = performance.getEntriesByType('paint');
            const resources = performance.getEntriesByType('resource');

            return {
                navigation: {
                    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                    tcp: navigation.connectEnd - navigation.connectStart,
                    request: navigation.responseStart - navigation.requestStart,
                    response: navigation.responseEnd - navigation.responseStart,
                    domInteractive: navigation.domInteractive,
                    domComplete: navigation.domComplete,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    totalTime: navigation.loadEventEnd - navigation.fetchStart,
                },
                paint: paint.map(p => ({ name: p.name, time: p.startTime })),
                resources: resources.map(r => ({
                    name: r.name,
                    duration: r.duration,
                    size: (r as any).transferSize,
                    type: (r as any).initiatorType,
                })).sort((a, b) => b.duration - a.duration),
            };
        });

        console.log('\n=== Navigation Timing ===');
        console.log(`DNS Lookup: ${performanceMetrics.navigation.dns.toFixed(2)}ms`);
        console.log(`TCP Connection: ${performanceMetrics.navigation.tcp.toFixed(2)}ms`);
        console.log(`Request Time: ${performanceMetrics.navigation.request.toFixed(2)}ms`);
        console.log(`Response Time: ${performanceMetrics.navigation.response.toFixed(2)}ms`);
        console.log(`DOM Interactive: ${performanceMetrics.navigation.domInteractive.toFixed(2)}ms`);
        console.log(`DOM Complete: ${performanceMetrics.navigation.domComplete.toFixed(2)}ms`);
        console.log(`Total Load Time: ${performanceMetrics.navigation.totalTime.toFixed(2)}ms`);

        console.log('\n=== Paint Timing ===');
        performanceMetrics.paint.forEach(p => {
            console.log(`${p.name}: ${p.time.toFixed(2)}ms`);
        });

        console.log('\n=== Top 20 Slowest Resources ===');
        performanceMetrics.resources.slice(0, 20).forEach((r, i) => {
            const sizeKB = r.size ? `${(r.size / 1024).toFixed(2)}KB` : 'N/A';
            console.log(`${i + 1}. [${r.type}] ${r.duration.toFixed(2)}ms (${sizeKB}) - ${r.name}`);
        });

        // 全リソースのサイズ集計
        const totalSize = performanceMetrics.resources.reduce((sum, r) => sum + (r.size || 0), 0);
        console.log(`\n=== Total Resources ===`);
        console.log(`Count: ${performanceMetrics.resources.length}`);
        console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

        // リソースタイプ別の分析
        const byType = performanceMetrics.resources.reduce((acc, r) => {
            if (!acc[r.type]) {
                acc[r.type] = { count: 0, totalSize: 0, totalDuration: 0 };
            }
            acc[r.type].count++;
            acc[r.type].totalSize += r.size || 0;
            acc[r.type].totalDuration += r.duration;
            return acc;
        }, {} as Record<string, { count: number; totalSize: number; totalDuration: number }>);

        console.log('\n=== Resources by Type ===');
        Object.entries(byType).forEach(([type, stats]) => {
            console.log(`${type}: ${stats.count} files, ${(stats.totalSize / 1024).toFixed(2)}KB, ${stats.totalDuration.toFixed(2)}ms total`);
        });

        // スクリーンショットを撮る
        await page.screenshot({ path: 'tests/screenshots/tomapon55-performance.png', fullPage: true });

        // Lighthouse的なメトリクス
        const webVitals = await page.evaluate(() => {
            return new Promise((resolve) => {
                const vitals: any = {};

                // LCP (Largest Contentful Paint)
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    vitals.lcp = lastEntry.startTime;
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // FID は実際のユーザーインタラクションが必要なのでスキップ

                // CLS (Cumulative Layout Shift)
                let cls = 0;
                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!(entry as any).hadRecentInput) {
                            cls += (entry as any).value;
                        }
                    }
                    vitals.cls = cls;
                }).observe({ entryTypes: ['layout-shift'] });

                // 少し待ってから結果を返す
                setTimeout(() => resolve(vitals), 2000);
            });
        });

        console.log('\n=== Web Vitals ===');
        console.log(`LCP (Largest Contentful Paint): ${(webVitals as any).lcp?.toFixed(2) || 'N/A'}ms`);
        console.log(`CLS (Cumulative Layout Shift): ${(webVitals as any).cls?.toFixed(4) || 'N/A'}`);
    });
});
