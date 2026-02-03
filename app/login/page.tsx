"use client";

import { useState } from "react";

const LoginPage = () => {
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.error ?? "ログインに失敗しました");
				return;
			}
			window.location.href = "/";
		} catch (err) {
			console.error(err);
			setError("ネットワークエラーが発生しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="rounded-2xl bg-amber-50 p-8 w-full max-w-md shadow-[8px_8px_0_0] shadow-amber-200 border-2 border-black">
			<div className="text-center mb-8">
				<h1 className="text-6xl font-bold p-3">ログイン</h1>
				<p className="text-center text-gray-700">パスワードはディスコをみてね</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-2">
					<label htmlFor="password" className="block text-sm font-semibold text-gray-800">
						パスワード
					</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						disabled={loading}
						className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
						placeholder="パスワードを入力"
					/>
				</div>

				{error && (
					<div className="text-red-600 text-sm font-semibold bg-red-50 p-3 rounded-lg border-2 border-red-200">
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="group relative inline-block w-full disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span className="absolute inset-0 translate-x-0 translate-y-0 w-full bg-yellow-300 transition-transform group-hover:translate-x-1.5 group-hover:translate-y-1.5 group-disabled:translate-x-0 group-disabled:translate-y-0"></span>
					<span className="relative inline-block border-2 border-current w-full px-8 py-3 text-sm font-bold tracking-widest uppercase bg-white">
						{loading ? "送信中..." : "ログイン"}
					</span>
				</button>
			</form>
		</main>
	);
};

export default LoginPage;
