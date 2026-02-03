import { test, expect } from '@playwright/test';

test.describe('Modal Component - Simple Check', () => {
    test('check modal exists and get screenshot', async ({ page }) => {
        // ページに移動
        await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });

        // ページのHTMLを取得してログ出力
        const html = await page.content();
        console.log('Page loaded, length:', html.length);

        // モーダル要素を探す
        const modalElement = await page.$('[data-testid="modal"]');
        console.log('Modal found:', !!modalElement);

        // すべてのdivを探す
        const allDivs = await page.$$('div');
        console.log('Total div elements:', allDivs.length);

        // スクリーンショットを撮影
        await page.screenshot({ path: 'tests/e2e/screenshots/page-full.png', fullPage: true });

        if (modalElement) {
            // モーダルのバウンディングボックスを取得
            const box = await modalElement.boundingBox();
            console.log('Modal bounding box:', box);

            // モーダルのスクリーンショット
            await modalElement.screenshot({ path: 'tests/e2e/screenshots/modal-only.png' });

            // 計算されたスタイルを取得
            const styles = await page.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                return {
                    display: computed.display,
                    position: computed.position,
                    width: computed.width,
                    height: computed.height,
                    backgroundColor: computed.backgroundColor,
                    top: computed.top,
                    left: computed.left,
                    transform: computed.transform,
                    zIndex: computed.zIndex,
                };
            }, modalElement);
            console.log('Modal computed styles:', JSON.stringify(styles, null, 2));
        }
    });
});
