"use client";
import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const standaloneNow = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(standaloneNow);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as PromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) && !standaloneNow;
    setIosHint(ios);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone || hidden) return null;

  async function install() {
    if (!promptEvent) {
      setIosHint(true);
      return;
    }
    await promptEvent.prompt();
    setPromptEvent(null);
  }

  return (
    <div className="mb-4 rounded-[28px] px-4 py-3 card-shadow" style={{ background: "var(--bg-elev)", border: "1px solid var(--line)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base">アプリとして使う</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            {iosHint ? "サファリの共有→「ホーム画面に追加」" : "ホーム画面に置くと、本物アプリのように開きます"}
          </p>
        </div>
        <button type="button" onClick={() => setHidden(true)} className="text-xs" style={{ color: "var(--muted)" }}>閉じる</button>
      </div>
      <button type="button" onClick={install} className="mt-3 w-full rounded-2xl py-2.5 text-sm font-medium" style={{ background: "var(--ink)", color: "var(--bg)" }}>
        {promptEvent ? "インストール" : iosHint ? "手順を見る" : "インストール"}
      </button>
    </div>
  );
}
