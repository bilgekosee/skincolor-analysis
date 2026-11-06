"use client";

import { useRef, useState } from "react";
import { describeBands, UNDERTONES, type Undertone } from "@/lib/color";
import type { AnalysisResult } from "@/lib/colorAnalysis";
import { analyzeCanvas, drawToCanvas, loadImage } from "@/lib/faceDetection";

type Row = {
  id: string;
  name: string;
  thumb: string;
  expected: Undertone;
  result: AnalysisResult | null;
  error?: string;
};

const LABELS = Object.keys(UNDERTONES) as Undertone[];

let nextRowId = 0;

export default function Calibration() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function addFiles(expected: Undertone, files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      const id = `row-${nextRowId++}`;
      const thumb = URL.createObjectURL(file);
      let row: Row = { id, name: file.name, thumb, expected, result: null };
      try {
        const image = await loadImage(file);
        drawToCanvas(canvasRef.current!, image, image.naturalWidth, image.naturalHeight);
        const result = await analyzeCanvas(canvasRef.current!);
        row = result ? { ...row, result } : { ...row, error: "Yüz bulunamadı" };
      } catch {
        row = { ...row, error: "Açılamadı ya da model yüklenemedi" };
      }
      setRows((prev) => [...prev, row]);
    }
    setBusy(false);
  }

  const scored = rows.filter((r) => r.result);
  const correct = scored.filter((r) => r.result!.undertone === r.expected).length;
  // Off by one step on the warm–cool scale (e.g. cool vs neutral-cool) counts as close.
  const scale: Undertone[] = ["warm", "neutralWarm", "neutral", "neutralCool", "cool"];
  const close = scored.filter((r) => {
    const a = scale.indexOf(r.expected);
    const b = scale.indexOf(r.result!.undertone);
    return r.result!.undertone === r.expected || (a >= 0 && b >= 0 && Math.abs(a - b) === 1);
  }).length;

  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm text-stone-600">
        Alt tonunu bildiğin kişilerin fotoğraflarını doğru gruba yükle. Her fotoğraf ana sayfadaki analizle aynı şekilde
        işlenir. Tahmin edilen alt ton, ton açısı ve eşikler aşağıdaki tabloda görünür. Fotoğraflar cihazında kalır,
        hiçbir yere yüklenmez.
      </p>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {LABELS.map((ut) => (
          <label
            key={ut}
            className="cursor-pointer rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-center text-sm hover:border-stone-900"
          >
            <span className="block font-medium text-stone-900">{UNDERTONES[ut].label}</span>
            <span className="text-xs text-stone-500">fotoğraf ekle</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                addFiles(ut, e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ))}
      </div>

      {busy && <p className="text-sm text-stone-600">Analiz ediliyor…</p>}

      {scored.length > 0 && (
        <div className="flex flex-wrap gap-6">
          <div className="rounded-2xl bg-stone-900 px-5 py-4 text-white">
            <p className="text-xs text-white/60">Doğruluk</p>
            <p className="text-2xl font-semibold tabular-nums">
              %{Math.round((correct / scored.length) * 100)}{" "}
              <span className="text-sm font-normal text-white/60">
                {correct}/{scored.length}
              </span>
            </p>
            <p className="mt-1 text-xs text-white/60 tabular-nums">
              Bir adım yakın dahil %{Math.round((close / scored.length) * 100)}
            </p>
          </div>
          <table className="text-sm tabular-nums">
            <thead>
              <tr className="text-xs text-stone-500">
                <th className="px-2 py-1 text-left font-normal">Gerçek \ Tahmin</th>
                {LABELS.map((p) => (
                  <th key={p} className="px-2 py-1 font-normal">
                    {UNDERTONES[p].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LABELS.map((e) => (
                <tr key={e}>
                  <td className="px-2 py-1 text-stone-600">{UNDERTONES[e].label}</td>
                  {LABELS.map((p) => {
                    const n = scored.filter((r) => r.expected === e && r.result!.undertone === p).length;
                    return (
                      <td
                        key={p}
                        className={`px-2 py-1 text-center ${n && e === p ? "font-semibold text-emerald-700" : ""} ${
                          n && e !== p ? "font-semibold text-red-700" : ""
                        }`}
                      >
                        {n || "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <p className="mb-2 text-xs text-stone-500">Ölçek: {describeBands()}</p>
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                <th className="py-2 pr-3 font-normal">Fotoğraf</th>
                <th className="py-2 pr-3 font-normal">Gerçek</th>
                <th className="py-2 pr-3 font-normal">Tahmin</th>
                <th className="py-2 pr-3 font-normal">Ten</th>
                <th className="py-2 pr-3 font-normal">Ton açısı</th>
                <th className="py-2 pr-3 font-normal">Doygunluk</th>
                <th className="py-2 pr-3 font-normal">L</th>
                <th className="py-2 pr-3 font-normal">Işık düzeltmesi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const res = r.result;
                const ok = res && res.undertone === r.expected;
                return (
                  <tr key={r.id} className="border-b border-stone-100">
                    <td className="py-2 pr-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                      <img src={r.thumb} alt={r.name} className="size-12 rounded-lg object-cover" />
                    </td>
                    <td className="py-2 pr-3">{UNDERTONES[r.expected].label}</td>
                    <td className={`py-2 pr-3 font-medium ${ok ? "text-emerald-700" : "text-red-700"}`}>
                      {res ? UNDERTONES[res.undertone].label + (res.reading.borderline ? " (sınırda)" : "") : r.error}
                    </td>
                    <td className="py-2 pr-3">
                      {res && (
                        <span
                          className="inline-block size-6 rounded-md border border-black/10 align-middle"
                          style={{ background: res.skin.hex }}
                        />
                      )}
                    </td>
                    <td className="py-2 pr-3">{res && `${res.reading.hue.toFixed(1)}°`}</td>
                    <td className="py-2 pr-3">{res && res.reading.chroma.toFixed(1)}</td>
                    <td className="py-2 pr-3">{res && res.skin.lab[0].toFixed(0)}</td>
                    <td className="py-2 pr-3">{res && (res.lightCorrected ? "Yapıldı" : "Gerek yok")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() => setRows([])}
            className="mt-4 text-xs text-stone-500 hover:text-stone-900"
          >
            Listeyi temizle
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
