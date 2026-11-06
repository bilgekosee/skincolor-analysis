"use client";

import { useEffect, useRef, useState } from "react";
import { seasonFor, type Undertone } from "@/lib/color";
import type { AnalysisResult } from "@/lib/colorAnalysis";
import { analyzeCanvas, drawToCanvas, loadImage } from "@/lib/faceDetection";
import type { SeasonKey } from "@/lib/palettes";

// Batch evaluation against the Deep Armocromia dataset (research use only).
// Its annotations.csv gives each image an expert season label in Italian;
// Spring/Autumn imply a warm undertone, Summer/Winter a cool one.

type Season4 = "spring" | "summer" | "autumn" | "winter";

const SEASON_IT: Record<string, Season4> = {
  primavera: "spring",
  estate: "summer",
  autunno: "autumn",
  inverno: "winter",
};
const SEASON_LABEL: Record<Season4, string> = {
  spring: "İlkbahar",
  summer: "Yaz",
  autumn: "Sonbahar",
  winter: "Kış",
};
const SEASONS4: Season4[] = ["spring", "summer", "autumn", "winter"];
const WARM: Season4[] = ["spring", "autumn"];

const TO_SEASON4: Record<SeasonKey, Season4> = {
  LS: "spring",
  WS: "spring",
  WA: "autumn",
  DA: "autumn",
  SA: "autumn",
  LSu: "summer",
  CS: "summer",
  SS: "summer",
  CW: "winter",
  DW: "winter",
};

type Temperature = "warm" | "cool" | "neutral";
const temperatureOf = (ut: Undertone): Temperature =>
  ut === "cool" || ut === "neutralCool" ? "cool" : ut === "neutral" ? "neutral" : "warm";

type Item = {
  path: string;
  season: Season4;
  subClass: string;
  result: AnalysisResult | null;
};

type Annotation = { path: string; season: Season4; subClass: string };

function parseAnnotations(text: string): Annotation[] {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header.split(",").map((c) => c.trim());
  const at = (name: string) => cols.indexOf(name);
  const iClass = at("class");
  const iSub = at("sub_class");
  const iPath = at("path_rgb_original");
  if (iClass < 0 || iPath < 0) throw new Error("annotations.csv beklenen sütunları içermiyor");
  return lines
    .map((line) => line.split(","))
    .map((f) => ({ path: f[iPath]?.trim(), season: SEASON_IT[f[iClass]?.trim()], subClass: f[iSub]?.trim() ?? "" }))
    .filter((a): a is Annotation => Boolean(a.path && a.season));
}

const quantile = (xs: number[], q: number) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

// Finds the single hue cut that best separates warm from cool (balanced accuracy).
function bestCut(warm: number[], cool: number[]) {
  let best = { cut: 60, score: 0 };
  for (let cut = 25; cut <= 85; cut += 0.5) {
    const tpr = warm.filter((h) => h >= cut).length / Math.max(warm.length, 1);
    const tnr = cool.filter((h) => h < cut).length / Math.max(cool.length, 1);
    const score = (tpr + tnr) / 2;
    if (score > best.score) best = { cut, score };
  }
  return best;
}

export default function DatasetEval() {
  const [csv, setCsv] = useState<Annotation[] | null>(null);
  const [files, setFiles] = useState<Map<string, File> | null>(null);
  const [limit, setLimit] = useState(400);
  const [items, setItems] = useState<Item[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    // Dev-only hook for scripted runs: browsers don't let code fill a folder picker.
    const hook = (csvText: string, entries: [path: string, file: File][]) => {
      setCsv(parseAnnotations(csvText));
      setFiles(new Map(entries));
    };
    Object.assign(window, { __loadDataset: hook });
    return () => {
      delete (window as { __loadDataset?: unknown }).__loadDataset;
    };
  }, []);

  async function onCsv(file: File | undefined) {
    if (!file) return;
    try {
      setCsv(parseAnnotations(await file.text()));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function onFolder(list: FileList | null) {
    if (!list) return;
    // annotations.csv paths are relative to the dataset root (e.g. "RGB/train/…"),
    // but the picked folder may be the root, the RGB folder or a parent of it.
    // Index every path suffix so any of those choices matches.
    const map = new Map<string, File>();
    for (const file of Array.from(list)) {
      const parts = (file.webkitRelativePath || file.name).split("/");
      for (let i = 0; i < parts.length; i++) map.set(parts.slice(i).join("/"), file);
    }
    setFiles(map);
  }

  async function run() {
    if (!csv || !files) return;
    // Even per-season sample, every k-th image, so runs are repeatable.
    const perSeason = Math.ceil(limit / SEASONS4.length);
    const picked: Annotation[] = [];
    for (const season of SEASONS4) {
      const pool = csv.filter((a) => a.season === season && files.has(a.path));
      const step = Math.max(1, Math.floor(pool.length / perSeason));
      for (let i = 0; i < pool.length && picked.filter((p) => p.season === season).length < perSeason; i += step) {
        picked.push(pool[i]);
      }
    }
    setItems([]);
    setProgress({ done: 0, total: picked.length });
    const out: Item[] = [];
    for (const a of picked) {
      let result: AnalysisResult | null = null;
      try {
        const image = await loadImage(files.get(a.path)!);
        drawToCanvas(canvasRef.current!, image, image.naturalWidth, image.naturalHeight);
        result = await analyzeCanvas(canvasRef.current!);
      } catch {
        result = null;
      }
      out.push({ ...a, result });
      setProgress({ done: out.length, total: picked.length });
    }
    setItems(out);
    setProgress(null);
    if (process.env.NODE_ENV === "development") Object.assign(window, { __datasetItems: out });
  }

  const scored = items.filter((i) => i.result);
  const warmHues = scored.filter((i) => WARM.includes(i.season)).map((i) => i.result!.reading.hue);
  const coolHues = scored.filter((i) => !WARM.includes(i.season)).map((i) => i.result!.reading.hue);
  const tempCorrect = scored.filter((i) => {
    const t = temperatureOf(i.result!.undertone);
    return t === (WARM.includes(i.season) ? "warm" : "cool");
  }).length;
  const neutralShare = scored.filter((i) => temperatureOf(i.result!.undertone) === "neutral").length;
  const cut = scored.length ? bestCut(warmHues, coolHues) : null;
  const predictedSeason = (i: Item) =>
    TO_SEASON4[seasonFor(i.result!.skin.hex, i.result!.hair.hex, i.result!.undertone).key];
  const seasonCorrect = scored.filter((i) => predictedSeason(i) === i.season).length;
  const pct = (n: number) => `%${scored.length ? Math.round((n / scored.length) * 100) : 0}`;

  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-black/5">
      <h2 className="text-lg font-semibold">Veri seti testi (Deep Armocromia)</h2>
      <p className="max-w-2xl text-sm text-stone-600">
        Uzmanların mevsim etiketi verdiği fotoğraflarla fotoğraf ölçümünü test eder. İlkbahar ve Sonbahar sıcak, Yaz ve
        Kış soğuk alt ton sayılır. Veri seti yalnızca araştırma amaçlıdır; fotoğraflar cihazında işlenir.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-stone-500">1. annotations.csv</span>
          <input type="file" accept=".csv" onChange={(e) => onCsv(e.target.files?.[0])} />
          {csv && <span className="text-xs text-stone-500">{csv.length} satır</span>}
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-stone-500">2. Fotoğraf klasörü (RGB)</span>
          {/* @ts-expect-error webkitdirectory is a non-standard but widely supported attribute */}
          <input type="file" multiple webkitdirectory="" onChange={(e) => onFolder(e.target.files)} />
          {files && csv && (
            <span className="text-xs text-stone-500">{csv.filter((a) => files.has(a.path)).length} fotoğraf eşleşti</span>
          )}
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-stone-500">3. Kaç fotoğraf (mevsimlere eşit)</span>
          <input
            type="number"
            min={20}
            max={4000}
            step={20}
            value={limit}
            onChange={(e) => setLimit(+e.target.value)}
            className="w-28 rounded-lg border border-stone-300 px-2 py-1"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="button"
        disabled={!csv || !files || progress !== null}
        onClick={run}
        className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        {progress ? `İşleniyor ${progress.done}/${progress.total}` : "Testi çalıştır"}
      </button>

      {scored.length > 0 && cut && (
        <div className="grid gap-4 text-sm tabular-nums" id="dataset-eval-results">
          <div className="grid gap-2 sm:grid-cols-4">
            <Stat label="Yüz bulunan" value={`${scored.length}/${items.length}`} />
            <Stat label="Sıcak/soğuk doğruluğu" value={pct(tempCorrect)} hint={`nötr: ${pct(neutralShare)}`} />
            <Stat
              label="En iyi tek sınır"
              value={`${cut.cut.toFixed(1)}°`}
              hint={`dengeli doğruluk %${Math.round(cut.score * 100)}`}
            />
            <Stat label="Mevsim doğruluğu (4 sınıf)" value={pct(seasonCorrect)} hint="şans: %25" />
          </div>

          <table className="w-fit">
            <thead>
              <tr className="text-xs text-stone-500">
                <th className="px-2 py-1 text-left font-normal">Etiket</th>
                <th className="px-2 py-1 font-normal">n</th>
                <th className="px-2 py-1 font-normal">Ton açısı 25%</th>
                <th className="px-2 py-1 font-normal">ortanca</th>
                <th className="px-2 py-1 font-normal">75%</th>
                {SEASONS4.map((p) => (
                  <th key={p} className="px-2 py-1 font-normal">
                    → {SEASON_LABEL[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEASONS4.map((season) => {
                const group = scored.filter((i) => i.season === season);
                const hues = group.map((i) => i.result!.reading.hue);
                return (
                  <tr key={season}>
                    <td className="px-2 py-1">{SEASON_LABEL[season]}</td>
                    <td className="px-2 py-1 text-center">{group.length}</td>
                    <td className="px-2 py-1 text-center">{quantile(hues, 0.25).toFixed(1)}°</td>
                    <td className="px-2 py-1 text-center">{quantile(hues, 0.5).toFixed(1)}°</td>
                    <td className="px-2 py-1 text-center">{quantile(hues, 0.75).toFixed(1)}°</td>
                    {SEASONS4.map((p) => {
                      const n = group.filter((i) => predictedSeason(i) === p).length;
                      return (
                        <td key={p} className={`px-2 py-1 text-center ${p === season && n ? "font-semibold text-emerald-700" : ""}`}>
                          {n || "·"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-stone-100 px-4 py-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
