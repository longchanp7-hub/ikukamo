import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const metadata: Metadata = {
  title: "行くかも",
  description: "豊橋起点。自分が行きそうなお出かけ候補。",
  applicationName: "行くかも",
  manifest: `${base}/manifest.webmanifest`,
  icons: { icon: `${base}/icons/icon.svg`, apple: `${base}/icons/icon.svg` },
  appleWebApp: { capable: true, title: "行くかも", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = {
  themeColor: "#8f3d28",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href={`${base}/icons/icon.svg`} />
      </head>
      <body className="app-bg">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
