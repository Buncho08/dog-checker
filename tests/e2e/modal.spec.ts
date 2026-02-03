import { test, expect } from '@playwright/test';

test.describe('Modal Component', () => {
    test('should display modal with proper layout', async ({ page }) => {
        await page.goto('http://localhost:3001');

        // モーダルが存在するか確認
        const modal = page.locator('[data-testid="modal"]').first();
        await expect(modal).toBeVisible({ timeout: 5000 });

        // モーダルのスタイルを確認
        const boundingBox = await modal.boundingBox();
        console.log('Modal position and size:', boundingBox);

        // スクリーンショットを撮影して視覚的に確認
        await page.screenshot({ path: 'tests/e2e/screenshots/modal-layout.png', fullPage: true });

        // モーダルの背景（オーバーレイ）が存在するか
        const overlay = page.locator('[data-testid="modal-overlay"]').first();
        const overlayExists = await overlay.count() > 0;
        console.log('Overlay exists:', overlayExists);

        // モーダルが中央に配置されているか確認
        if (boundingBox) {
            const viewportSize = page.viewportSize();
            if (viewportSize) {
                const centerX = boundingBox.x + boundingBox.width / 2;
                const centerY = boundingBox.y + boundingBox.height / 2;
                const viewportCenterX = viewportSize.width / 2;
                const viewportCenterY = viewportSize.height / 2;

                console.log('Modal center:', { x: centerX, y: centerY });
                console.log('Viewport center:', { x: viewportCenterX, y: viewportCenterY });

                // モーダルが画面中央付近にあるかチェック（許容誤差±100px）
                const isCentered = Math.abs(centerX - viewportCenterX) < 100 &&
                    Math.abs(centerY - viewportCenterY) < 100;
                console.log('Is centered:', isCentered);
            }
        }
    });
});
