import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const metadata: Metadata = {
  title: "行くかも",
  description: "豊橋起点。自分が行きそうなお出かけ候補。",
  applicationName: "行くかも",
  manifest: `${base}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: "行くかも", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#9c4a2b", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (<html lang="ja"><body><PwaRegister />{children}</body></html>);
}
