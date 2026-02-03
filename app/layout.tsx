import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Dog Checker",
  description: "DOG/NOT_DOG classifier",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja" className="h-screen">
      <body className="h-full bg-amber-300 flex justify-center items-center relative">{children}</body>
    </html>
  );
}
