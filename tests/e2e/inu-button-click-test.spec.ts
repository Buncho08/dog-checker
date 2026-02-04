import { test, expect } from '@playwright/test';

test.describe('いぬボタンの実際の動作確認', () => {
    test('ホームページで「いぬ」「いぬじゃない」ボタンをクリックしてテスト', async ({ page }) => {
        console.log('\n==================================================');
        console.log('  いぬボタン動作テスト');
        console.log('==================================================\n');

        // ログイン
        console.log('Step 1: ログイン中...');
        await page.goto('https://tomapon55.net/login');
        await page.locator('input[type="password"]').fill('bansan');
        await page.locator('button[type="submit"]').click();
        await page.waitForURL('https://tomapon55.net/');
        console.log('✓ ログイン成功\n');

        // 初期状態をスクリーンショット
        await page.screenshot({
            path: 'tests/screenshots/test-01-home.png',
            fullPage: true
        });

        // ページ内容を確認
        console.log('Step 2: ホームページの確認');
        console.log('URL:', page.url());

        const heading = await page.locator('h1, h2').first().textContent();
        console.log('ページ見出し:', heading);

        // 画像を確認
        const images = page.locator('img');
        const imageCount = await images.count();
        console.log(`表示されている画像: ${imageCount}個`);

        if (imageCount > 0) {
            const firstImageSrc = await images.first().getAttribute('src');
            console.log('最初の画像:', firstImageSrc);
        }

        // ボタンを確認
        console.log('\nStep 3: ボタンの確認');
        const inuButton = page.getByRole('button', { name: /^いぬ$/i });
        const notInuButton = page.getByRole('button', { name: /いぬじゃない/i });
        const anotherButton = page.getByRole('button', { name: /別の画像/i });

        const hasInuButton = await inuButton.count() > 0;
        const hasNotInuButton = await notInuButton.count() > 0;
        const hasAnotherButton = await anotherButton.count() > 0;

        console.log(`「いぬ」ボタン: ${hasInuButton ? '✓ あり' : '✗ なし'}`);
        console.log(`「いぬじゃない」ボタン: ${hasNotInuButton ? '✓ あり' : '✗ なし'}`);
        console.log(`「別の画像をみる」ボタン: ${hasAnotherButton ? '✓ あり' : '✗ なし'}`);

        if (!hasInuButton || !hasNotInuButton) {
            console.log('\n⚠️ ボタンが見つかりません');
            return;
        }

        // 「いぬ」ボタンをクリック
        console.log('\n==================================================');
        console.log('  TEST 1: 「いぬ」ボタンをクリック');
        console.log('==================================================\n');

        // クリック前の画像URLを記録
        const imageBeforeClick = await images.first().getAttribute('src');
        console.log('クリック前の画像:', imageBeforeClick);

        await inuButton.click();
        console.log('✓ 「いぬ」ボタンをクリックしました');

        // レスポンスを待つ
        await page.waitForTimeout(2000);

        await page.screenshot({
            path: 'tests/screenshots/test-02-after-inu-click.png',
            fullPage: true
        });

        // モーダルやメッセージを確認
        const bodyAfterClick = await page.locator('body').textContent();

        // 「正解」「不正解」「いぬです」などのテキストを探す
        const hasCorrect = bodyAfterClick?.includes('正解') || bodyAfterClick?.includes('◯') || bodyAfterClick?.includes('○');
        const hasIncorrect = bodyAfterClick?.includes('不正解') || bodyAfterClick?.includes('×') || bodyAfterClick?.includes('✗');
        const hasInu = bodyAfterClick?.includes('いぬです') || bodyAfterClick?.includes('犬です');
        const hasNotInu = bodyAfterClick?.includes('いぬじゃない') || bodyAfterClick?.includes('犬じゃない');

        console.log('\n結果の判定:');
        if (hasCorrect) console.log('  ✓ 「正解」メッセージ検出');
        if (hasIncorrect) console.log('  ✓ 「不正解」メッセージ検出');
        if (hasInu) console.log('  ✓ 「いぬです」メッセージ検出');
        if (hasNotInu) console.log('  ✓ 「いぬじゃない」メッセージ検出');

        // モーダルがあれば閉じる
        const closeButton = page.locator('button:has-text("閉じる"), button:has-text("OK"), button:has-text("×")').first();
        const hasCloseButton = await closeButton.count() > 0;

        if (hasCloseButton) {
            console.log('\nモーダルを閉じます...');
            await closeButton.click();
            await page.waitForTimeout(500);
        }

        // 新しい画像が読み込まれたか確認
        const imageAfterClick = await images.first().getAttribute('src');
        const imageChanged = imageBeforeClick !== imageAfterClick;
        console.log(`画像の変更: ${imageChanged ? '✓ 変わりました' : '変わっていません'}`);
        if (imageChanged) {
            console.log('新しい画像:', imageAfterClick);
        }

        await page.screenshot({
            path: 'tests/screenshots/test-03-after-modal-close.png',
            fullPage: true
        });

        // 「いぬじゃない」ボタンをクリック
        console.log('\n==================================================');
        console.log('  TEST 2: 「いぬじゃない」ボタンをクリック');
        console.log('==================================================\n');

        // クリック前の画像URLを記録
        const imageBeforeClick2 = await images.first().getAttribute('src');
        console.log('クリック前の画像:', imageBeforeClick2);

        const notInuButton2 = page.getByRole('button', { name: /いぬじゃない/i });
        await notInuButton2.click();
        console.log('✓ 「いぬじゃない」ボタンをクリックしました');

        // レスポンスを待つ
        await page.waitForTimeout(2000);

        await page.screenshot({
            path: 'tests/screenshots/test-04-after-not-inu-click.png',
            fullPage: true
        });

        // 結果を確認
        const bodyAfterClick2 = await page.locator('body').textContent();

        const hasCorrect2 = bodyAfterClick2?.includes('正解') || bodyAfterClick2?.includes('◯') || bodyAfterClick2?.includes('○');
        const hasIncorrect2 = bodyAfterClick2?.includes('不正解') || bodyAfterClick2?.includes('×') || bodyAfterClick2?.includes('✗');
        const hasInu2 = bodyAfterClick2?.includes('いぬです') || bodyAfterClick2?.includes('犬です');
        const hasNotInu2 = bodyAfterClick2?.includes('いぬじゃない') || bodyAfterClick2?.includes('犬じゃない');

        console.log('\n結果の判定:');
        if (hasCorrect2) console.log('  ✓ 「正解」メッセージ検出');
        if (hasIncorrect2) console.log('  ✓ 「不正解」メッセージ検出');
        if (hasInu2) console.log('  ✓ 「いぬです」メッセージ検出');
        if (hasNotInu2) console.log('  ✓ 「いぬじゃない」メッセージ検出');

        // モーダルを閉じる
        const closeButton2 = page.locator('button:has-text("閉じる"), button:has-text("OK"), button:has-text("×")').first();
        const hasCloseButton2 = await closeButton2.count() > 0;

        if (hasCloseButton2) {
            console.log('\nモーダルを閉じます...');
            await closeButton2.click();
            await page.waitForTimeout(500);
        }

        // 新しい画像が読み込まれたか確認
        const imageAfterClick2 = await images.first().getAttribute('src');
        const imageChanged2 = imageBeforeClick2 !== imageAfterClick2;
        console.log(`画像の変更: ${imageChanged2 ? '✓ 変わりました' : '変わっていません'}`);
        if (imageChanged2) {
            console.log('新しい画像:', imageAfterClick2);
        }

        await page.screenshot({
            path: 'tests/screenshots/test-05-final.png',
            fullPage: true
        });

        // 「別の画像をみる」ボタンもテスト
        console.log('\n==================================================');
        console.log('  TEST 3: 「別の画像をみる」ボタンをクリック');
        console.log('==================================================\n');

        const anotherButton2 = page.getByRole('button', { name: /別の画像/i });
        const hasAnotherButton2 = await anotherButton2.count() > 0;

        if (hasAnotherButton2) {
            const imageBeforeClick3 = await images.first().getAttribute('src');
            console.log('クリック前の画像:', imageBeforeClick3);

            await anotherButton2.click();
            console.log('✓ 「別の画像をみる」ボタンをクリックしました');

            await page.waitForTimeout(1000);

            const imageAfterClick3 = await images.first().getAttribute('src');
            const imageChanged3 = imageBeforeClick3 !== imageAfterClick3;
            console.log(`画像の変更: ${imageChanged3 ? '✓ 変わりました' : '変わっていません'}`);
            if (imageChanged3) {
                console.log('新しい画像:', imageAfterClick3);
            }

            await page.screenshot({
                path: 'tests/screenshots/test-06-another-image.png',
                fullPage: true
            });
        }

        console.log('\n==================================================');
        console.log('  テスト完了！');
        console.log('==================================================\n');
        console.log('すべてのスクリーンショットは tests/screenshots/ に保存されました');
    });
});
