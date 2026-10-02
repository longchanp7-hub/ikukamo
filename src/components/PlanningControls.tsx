"use client";
import { useState } from "react";
import { ORIGINS, validCoordinates, type Origin } from "@/lib/outing-context";
export function PlanningControls({ origin, setOrigin, visit, setVisit, indoor, setIndoor, nearby, setNearby, visitOnly, setVisitOnly, weather, busy, loadWeather }: {
  origin: Origin; setOrigin: (o: Origin) => void; visit: string; setVisit: (s: string) => void;
  indoor: boolean; setIndoor: (v: boolean) => void; nearby: boolean; setNearby: (v: boolean) => void;
  visitOnly: boolean; setVisitOnly: (v: boolean) => void; weather: string; busy: boolean; loadWeather: () => void;
}) {
  const [geo, setGeo] = useState("");
  const [locating, setLocating] = useState(false);
  function locate() {
    if (!window.isSecureContext || !navigator.geolocation) { setGeo("現在地を使えません。下の地域を選んでください。"); return; }
    setLocating(true); setGeo("現在地を確認中…");
    navigator.geolocation.getCurrentPosition(p => {
      setLocating(false);
      if (!validCoordinates(p.coords.latitude, p.coords.longitude)) { setGeo("位置情報が不正です。選択中の地域を使います。"); return; }
      setOrigin({ name: "現在地", latitude: p.coords.latitude, longitude: p.coords.longitude });
      setGeo(`現在地を使用中（精度 約${Math.round(p.coords.accuracy)}m）。この画面を閉じると消えます。`);
    }, e => { setLocating(false); setGeo(e.code === 1 ? "位置情報が許可されませんでした。地域を選んで使えます。" : e.code === 3 ? "位置情報が時間切れになりました。地域を選んで使えます。" : "現在地を取得できません。地域を選んで使えます。"); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }
  return <details className="planning mb-4 rounded-3xl p-4" open>
    <summary className="font-medium">出発地・訪問日時・天気</summary>
    <p className="my-2 text-sm">出発地：<strong>{origin.name}</strong>（距離は直線の目安）</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={locate} disabled={locating}>現在地を使う</button>
      <label>地域 <select aria-label="出発地域" value={origin.name === "現在地" ? "" : origin.name} onChange={e => { const o = ORIGINS.find(o => o.name === e.target.value); if (o) { setOrigin(o); setGeo(""); } }}>
        <option value="" disabled>現在地</option>{ORIGINS.map(o => <option key={o.name}>{o.name}</option>)}
      </select></label>
    </div>
    {geo && <p role="status" className="mt-2 text-xs">{geo}</p>}
    <label className="mt-3 block text-sm">訪問日時（日本時間）<input aria-label="訪問日時" className="mt-1 block w-full" type="datetime-local" value={visit} onChange={e => setVisit(e.target.value)} /></label>
    <div className="my-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      <label><input type="checkbox" checked={visitOnly} onChange={e => setVisitOnly(e.target.checked)} /> 訪問日のみ</label>
      <label><input type="checkbox" checked={nearby} onChange={e => setNearby(e.target.checked)} /> 近い順</label>
      <label><input type="checkbox" checked={indoor} onChange={e => setIndoor(e.target.checked)} /> 屋内確認済みのみ</label>
    </div>
    <button type="button" disabled={busy || !visit} onClick={loadWeather}>{busy ? "天気を取得中…" : "会場の天気を取得"}</button>
    <p role="status" className="mt-2 text-xs">{weather || "未取得。取得すると会場の座標を小数2桁に丸めてOpen-Meteoへ送ります。現在地は送りません。"}</p>
    <p className="mt-2 text-xs opacity-75">個人の非商用利用向け。無料予報は最大14日先・30分キャッシュ。範囲外・通信失敗は「不明」。雨予報では屋内確認済みを優先します。会期内でも日ごとの開場時間は公式情報で確認してください。<a className="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">天気: Open-Meteo</a></p>
  </details>;
}
