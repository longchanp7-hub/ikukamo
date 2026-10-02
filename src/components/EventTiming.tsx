"use client";
import { useEffect, useState } from "react";
export function EventTiming({ endAt }: { endAt: string }) {
  const [ended, setEnded] = useState(false);
  useEffect(() => { const check=()=>setEnded(Date.parse(endAt)<=Date.now()); check();const timer=setInterval(check,60000);return()=>clearInterval(timer); }, [endAt]);
  return ended ? <p role="status" className="mt-4 rounded-2xl border p-3 text-sm">この予定の掲載会期は終了しています。履歴として表示しています。</p> : null;
}
