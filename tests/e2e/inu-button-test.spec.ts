import { test, expect } from '@playwright/test';

test.describe('いぬボタン操作テスト（ログイン付き）', () => {
    test('ログインして「いぬ」「いぬじゃない」ボタンをテスト', async ({ page }) => {
        console.log('\n=== Step 1: ログインページにアクセス ===\n');

        await page.goto('https://tomapon55.net/login', {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        await page.screenshot({
            path: 'tests/screenshots/login-01-initial.png',
            fullPage: true
        });

        console.log('ログインページを開きました');

        // パスワード入力欄を探す
        const passwordInput = page.locator('input[type="password"]').first();
        const loginButton = page.locator('button[type="submit"]').first();

        // Discordから取得したパスワードを入力（環境変数から）
        const password = process.env.AUTH_PASSWORD || 'bansan';

        console.log('パスワードを入力します...');
        await passwordInput.fill(password);

        await page.screenshot({
            path: 'tests/screenshots/login-02-filled.png',
            fullPage: true
        });

        console.log('ログインボタンをクリックします...');
        await loginButton.click();

        // ログイン後の遷移を待つ
        try {
            await page.waitForURL('https://tomapon55.net/', { timeout: 10000 });
            console.log('✓ ログイン成功！ホームページにリダイレクトされました');
        } catch (e) {
            console.log('ログイン後のURL:', page.url());
            if (page.url().includes('/login')) {
                console.log('⚠️ ログインに失敗した可能性があります');
                const errorMessage = await page.locator('body').textContent();
                console.log('エラーメッセージ:', errorMessage?.substring(0, 200));
            }
        }

        await page.waitForLoadState('networkidle');
        await page.screenshot({
            path: 'tests/screenshots/login-03-after-login.png',
            fullPage: true
        });

        console.log('\n=== Step 2: ホームページの探索 ===\n');
        console.log('現在のURL:', page.url());

        // ページの内容を確認
        const bodyText = await page.locator('body').textContent();
        console.log('ページ内容（最初の500文字）:');
        console.log(bodyText?.substring(0, 500));

        // すべてのリンクを確認
        const links = page.locator('a');
        const linkCount = await links.count();
        console.log(`\nリンク数: ${linkCount}`);

        if (linkCount > 0) {
            console.log('リンク一覧:');
            for (let i = 0; i < Math.min(linkCount, 10); i++) {
                const href = await links.nth(i).getAttribute('href');
                const text = await links.nth(i).textContent();
                console.log(`  ${i + 1}. ${href} - "${text?.trim()}"`);
            }
        }

        // ボタンを確認
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        console.log(`\nボタン数: ${buttonCount}`);

        if (buttonCount > 0) {
            console.log('ボタン一覧:');
            for (let i = 0; i < buttonCount; i++) {
                const text = await buttons.nth(i).textContent();
                const isVisible = await buttons.nth(i).isVisible();
                console.log(`  ${i + 1}. "${text?.trim()}" (表示: ${isVisible})`);
            }
        }

        console.log('\n=== Step 3: /check ページにアクセス ===\n');

        // checkページに直接アクセス
        await page.goto('https://tomapon55.net/check', {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        console.log('現在のURL:', page.url());

        await page.screenshot({
            path: 'tests/screenshots/check-01-initial.png',
            fullPage: true
        });

        // ページの内容を確認
        const checkPageText = await page.locator('body').textContent();
        console.log('\n/check ページの内容（最初の1000文字）:');
        console.log(checkPageText?.substring(0, 1000));

        // ファイルアップロード要素を探す
        const fileInputs = page.locator('input[type="file"]');
        const fileInputCount = await fileInputs.count();
        console.log(`\nファイル入力欄: ${fileInputCount}個`);

        // 画像を探す
        const images = page.locator('img');
        const imageCount = await images.count();
        console.log(`画像: ${imageCount}個`);

        if (imageCount > 0) {
            for (let i = 0; i < Math.min(imageCount, 5); i++) {
                const src = await images.nth(i).getAttribute('src');
                const alt = await images.nth(i).getAttribute('alt');
                console.log(`  ${i + 1}. src="${src}", alt="${alt}"`);
            }
        }

        // ボタンを再確認
        const checkButtons = page.locator('button');
        const checkButtonCount = await checkButtons.count();
        console.log(`\nボタン数: ${checkButtonCount}`);

        if (checkButtonCount > 0) {
            console.log('ボタン一覧:');
            for (let i = 0; i < checkButtonCount; i++) {
                const text = await checkButtons.nth(i).textContent();
                const isVisible = await checkButtons.nth(i).isVisible();
                const isDisabled = await checkButtons.nth(i).isDisabled();
                console.log(`  ${i + 1}. "${text?.trim()}" (表示: ${isVisible}, 無効: ${isDisabled})`);
            }
        }

        // 「いぬ」ボタンを探す
        console.log('\n=== Step 4: 「いぬ」ボタンを探す ===\n');

        const inuButtons = page.getByRole('button', { name: /いぬ/i });
        const inuButtonCount = await inuButtons.count();
        console.log(`「いぬ」を含むボタン: ${inuButtonCount}個`);

        const notInuButtons = page.getByRole('button', { name: /いぬじゃない|犬じゃない/i });
        const notInuButtonCount = await notInuButtons.count();
        console.log(`「いぬじゃない」を含むボタン: ${notInuButtonCount}個`);

        // 画像がアップロードされるまでボタンが表示されない可能性があるため、
        // ダミー画像をアップロードしてみる
        if (fileInputCount > 0 && inuButtonCount === 0) {
            console.log('\n=== Step 5: 画像をアップロードしてボタンを表示 ===\n');

            // テスト用の小さな画像を作成
            console.log('テスト用画像を生成中...');

            // Canvas APIを使用して小さな画像を生成
            const testImageDataUrl = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#808080';
                    ctx.fillRect(0, 0, 100, 100);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '20px Arial';
                    ctx.fillText('Test', 30, 55);
                }
                return canvas.toDataURL('image/png');
            });

            console.log('画像データURL生成完了（長さ:', testImageDataUrl.length, 'バイト）');

            // ファイル入力欄にフォーカス
            const fileInput = fileInputs.first();

            // 実際のファイルをアップロードする別の方法を試す
            // テスト用に既存の画像を使用するか、Base64から生成
            console.log('\n※ 実際の画像ファイルのアップロードが必要な場合、手動でテストを行ってください');

            // インプット要素が見えるか確認
            const isFileInputVisible = await fileInput.isVisible();
            console.log(`ファイル入力欄の表示状態: ${isFileInputVisible}`);
        }

        // もしボタンが見つかったら、クリックしてみる
        if (inuButtonCount > 0) {
            console.log('\n=== Step 6: 「いぬ」ボタンをクリック ===\n');

            await inuButtons.first().click();
            await page.waitForTimeout(2000);

            await page.screenshot({
                path: 'tests/screenshots/check-02-after-inu-click.png',
                fullPage: true
            });

            console.log('✓ 「いぬ」ボタンをクリックしました');

            // 結果を確認
            const resultText = await page.locator('body').textContent();
            console.log('\nクリック後の内容:');
            console.log(resultText?.substring(0, 500));
        }

        if (notInuButtonCount > 0) {
            console.log('\n=== Step 7: 「いぬじゃない」ボタンをクリック ===\n');

            // ページをリロードしてから再度テスト
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const notInuButton = page.getByRole('button', { name: /いぬじゃない|犬じゃない/i }).first();
            await notInuButton.click();
            await page.waitForTimeout(2000);

            await page.screenshot({
                path: 'tests/screenshots/check-03-after-not-inu-click.png',
                fullPage: true
            });

            console.log('✓ 「いぬじゃない」ボタンをクリックしました');

            // 結果を確認
            const resultText = await page.locator('body').textContent();
            console.log('\nクリック後の内容:');
            console.log(resultText?.substring(0, 500));
        }

        console.log('\n=== テスト完了 ===');
        console.log('すべてのスクリーンショットは tests/screenshots/ に保存されました');
    });
});
