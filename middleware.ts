import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "session";

const getSecret = (): Uint8Array => {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error("AUTH_SECRET is not set");
    }
    return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ログインページとAPIエンドポイント（ログイン用）は認証不要
    if (pathname === "/login" || pathname === "/api/auth/login") {
        return NextResponse.next();
    }

    // セッションCookieを取得
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // セッショントークンがない場合はログインページにリダイレクト
    if (!sessionToken) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // トークンを検証（Edge Runtimeで直接jwtVerifyを使用）
    try {
        const secret = getSecret();
        const { payload } = await jwtVerify(sessionToken, secret, {
            algorithms: ["HS256"],
        });

        if (payload.type !== "session") {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // 認証成功、リクエストを続行
        return NextResponse.next();
    } catch (error) {
        // トークンが無効な場合もログインページにリダイレクト
        console.error("Token verification failed:", error);
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

// ミドルウェアを適用するパスを設定
export const config = {
    matcher: [
        /*
         * 以下のパス以外すべてにマッチ:
         * - _next/static (静的ファイル)
         * - _next/image (画像最適化ファイル)
         * - favicon.ico (faviconファイル)
         * - public配下のファイル (public folder)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wasm|mjs|js)$).*)",
    ],
};
