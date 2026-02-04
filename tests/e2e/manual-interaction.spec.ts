import { test, expect } from '@playwright/test';

test.describe('Manual Interaction Test - いぬボタン', () => {
    test('「いぬ」「いぬじゃない」ボタンの動作確認', async ({ page }) => {
        console.log('\n=== https://tomapon55.net/ にアクセス ===\n');

        // ページにアクセス
        await page.goto('https://tomapon55.net/', {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        // スクリーンショット: 初期状態
        await page.screenshot({
            path: 'tests/screenshots/01-initial-page.png',
            fullPage: true
        });

        console.log('初期ページのスクリーンショットを保存しました');

        // ページのタイトルを確認
        const title = await page.title();
        console.log(`ページタイトル: ${title}`);

        // ログインが必要か確認
        const url = page.url();
        console.log(`現在のURL: ${url}`);

        if (url.includes('/login')) {
            console.log('\n=== ログインページにリダイレクトされました ===\n');

            // ログインフォームを探す
            const usernameInput = page.locator('input[name="username"], input[type="text"], input[placeholder*="ユーザー"], input[placeholder*="user"]').first();
            const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
            const loginButton = page.locator('button[type="submit"], button:has-text("ログイン"), button:has-text("Login")').first();

            // フォームが存在するか確認
            const hasUsername = await usernameInput.count() > 0;
            const hasPassword = await passwordInput.count() > 0;
            const hasLoginButton = await loginButton.count() > 0;

            console.log(`ユーザー名入力欄: ${hasUsername ? '見つかりました' : '見つかりません'}`);
            console.log(`パスワード入力欄: ${hasPassword ? '見つかりました' : '見つかりません'}`);
            console.log(`ログインボタン: ${hasLoginButton ? '見つかりました' : '見つかりません'}`);

            if (hasUsername && hasPassword && hasLoginButton) {
                console.log('\n※ ログインが必要です。環境変数からログイン情報を取得します。\n');

                // 環境変数からログイン情報を取得（テスト用）
                const username = process.env.TEST_USERNAME || 'test';
                const password = process.env.TEST_PASSWORD || 'test';

                console.log(`ユーザー名「${username}」でログイン試行...`);

                await usernameInput.fill(username);
                await passwordInput.fill(password);

                await page.screenshot({
                    path: 'tests/screenshots/02-login-form-filled.png',
                    fullPage: true
                });

                await loginButton.click();

                // ログイン後の遷移を待つ
                await page.waitForLoadState('networkidle', { timeout: 10000 });

                const afterLoginUrl = page.url();
                console.log(`ログイン後のURL: ${afterLoginUrl}`);

                await page.screenshot({
                    path: 'tests/screenshots/03-after-login.png',
                    fullPage: true
                });
            }
        }

        // メインページを探す
        console.log('\n=== メインページの要素を探索 ===\n');

        // ページの全体構造を確認
        const bodyText = await page.locator('body').textContent();
        console.log('ページに含まれるテキスト（最初の500文字）:');
        console.log(bodyText?.substring(0, 500));

        // 「いぬ」ボタンを探す
        const inuButtons = page.getByRole('button', { name: /いぬ/i });
        const inuButtonCount = await inuButtons.count();
        console.log(`\n「いぬ」を含むボタン数: ${inuButtonCount}`);

        // 「いぬじゃない」ボタンを探す
        const notInuButtons = page.getByRole('button', { name: /いぬじゃない|犬じゃない/i });
        const notInuButtonCount = await notInuButtons.count();
        console.log(`「いぬじゃない」を含むボタン数: ${notInuButtonCount}`);

        // すべてのボタンを列挙
        const allButtons = page.locator('button');
        const buttonCount = await allButtons.count();
        console.log(`\nページ内の全ボタン数: ${buttonCount}`);

        if (buttonCount > 0) {
            console.log('\n全ボタンのテキスト:');
            for (let i = 0; i < Math.min(buttonCount, 20); i++) {
                const buttonText = await allButtons.nth(i).textContent();
                const isVisible = await allButtons.nth(i).isVisible();
                console.log(`  ${i + 1}. "${buttonText?.trim()}" (表示: ${isVisible ? 'Yes' : 'No'})`);
            }
        }

        // 画像があるか確認
        const images = page.locator('img');
        const imageCount = await images.count();
        console.log(`\n画像の数: ${imageCount}`);

        if (imageCount > 0) {
            console.log('画像のsrc:');
            for (let i = 0; i < Math.min(imageCount, 5); i++) {
                const src = await images.nth(i).getAttribute('src');
                console.log(`  ${i + 1}. ${src}`);
            }
        }

        // 最終的なスクリーンショット
        await page.screenshot({
            path: 'tests/screenshots/04-final-state.png',
            fullPage: true
        });

        // もしボタンが見つかった場合、実際にクリックしてみる
        if (inuButtonCount > 0) {
            console.log('\n=== 「いぬ」ボタンをクリック ===\n');

            const inuButton = inuButtons.first();
            await inuButton.click();

            // クリック後の状態を待つ
            await page.waitForTimeout(1000);

            await page.screenshot({
                path: 'tests/screenshots/05-after-inu-click.png',
                fullPage: true
            });

            console.log('「いぬ」ボタンをクリックしました');

            // ページの変化を確認
            const afterClickText = await page.locator('body').textContent();
            console.log('\nクリック後のページテキスト（最初の500文字）:');
            console.log(afterClickText?.substring(0, 500));
        }

        if (notInuButtonCount > 0) {
            console.log('\n=== 「いぬじゃない」ボタンをクリック ===\n');

            const notInuButton = notInuButtons.first();
            await notInuButton.click();

            // クリック後の状態を待つ
            await page.waitForTimeout(1000);

            await page.screenshot({
                path: 'tests/screenshots/06-after-not-inu-click.png',
                fullPage: true
            });

            console.log('「いぬじゃない」ボタンをクリックしました');

            // ページの変化を確認
            const afterClickText = await page.locator('body').textContent();
            console.log('\nクリック後のページテキスト（最初の500文字）:');
            console.log(afterClickText?.substring(0, 500));
        }

        // ネットワークリクエストも確認
        console.log('\n=== テスト完了 ===');
        console.log('スクリーンショットは tests/screenshots/ に保存されました');
    });

    test('ホームページからの遷移を確認', async ({ page }) => {
        console.log('\n=== ホームページからチェックページへの遷移 ===\n');

        await page.goto('https://tomapon55.net/', {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        // /check ページへのリンクを探す
        const checkLink = page.locator('a[href*="/check"], a:has-text("チェック"), a:has-text("判定"), a:has-text("check")').first();
        const hasCheckLink = await checkLink.count() > 0;

        console.log(`チェックページへのリンク: ${hasCheckLink ? '見つかりました' : '見つかりません'}`);

        if (hasCheckLink) {
            await checkLink.click();
            await page.waitForLoadState('networkidle');

            console.log(`遷移後のURL: ${page.url()}`);

            await page.screenshot({
                path: 'tests/screenshots/07-check-page.png',
                fullPage: true
            });
        }

        // 直接 /check にアクセス
        console.log('\n=== /check ページに直接アクセス ===\n');

        await page.goto('https://tomapon55.net/check', {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        console.log(`URL: ${page.url()}`);

        // ボタンを再確認
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        console.log(`ボタン数: ${buttonCount}`);

        if (buttonCount > 0) {
            console.log('\nボタンのテキスト:');
            for (let i = 0; i < buttonCount; i++) {
                const text = await buttons.nth(i).textContent();
                console.log(`  ${i + 1}. "${text?.trim()}"`);
            }
        }

        await page.screenshot({
            path: 'tests/screenshots/08-check-page-direct.png',
            fullPage: true
        });
    });
});
