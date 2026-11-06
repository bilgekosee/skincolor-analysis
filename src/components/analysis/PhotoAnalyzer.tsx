"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/colorAnalysis";
import { analyzeCanvas, buildDrape, drawMarkers, drawToCanvas, getLandmarker, loadImage, type DrapeImage } from "@/lib/faceDetection";

type Status = "idle" | "camera" | "analyzing" | "done" | "error";

export default function PhotoAnalyzer({
  onResult,
}: {
  // `drape` holds an unmarked portrait crop for the drape test; it stays in the browser.
  onResult: (result: AnalysisResult, drape: DrapeImage) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => stopCamera, []);

  async function openCamera() {
    setMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setStatus("camera");
      // Start the model download while the user frames the shot.
      getLandmarker().catch(() => {});
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setStatus("error");
      setMessage("Kameraya erişilemedi. Tarayıcı izinlerini kontrol et ya da fotoğraf yükle.");
    }
  }

  async function analyze(source: CanvasImageSource, width: number, height: number, mirror = false) {
    setStatus("analyzing");
    setMessage("");
    const canvas = canvasRef.current!;
    const ctx = drawToCanvas(canvas, source, width, height, mirror);
    try {
      const analysis = await analyzeCanvas(canvas);
      if (!analysis) {
        setStatus("error");
        setMessage("Yüz bulunamadı. Yüzün net ve önden göründüğü bir fotoğraf dene.");
        return;
      }
      const drape = await buildDrape(canvas, analysis);
      if (process.env.NODE_ENV === "development") {
        // Dev-only inspection hook: the unmarked frame and the raw measurements stay in this page.
        Object.assign(window, { __lastAnalysis: analysis, __lastPhoto: drape.src });
      }
      drawMarkers(ctx, analysis);
      setResult(analysis);
      setStatus("done");
      onResult(analysis, drape);
    } catch {
      setStatus("error");
      setMessage("Analiz modeli yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    analyze(video, video.videoWidth, video.videoHeight, true);
    stopCamera();
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    stopCamera();
    loadImage(file)
      .then((image) => analyze(image, image.naturalWidth, image.naturalHeight))
      .catch(() => {
        setStatus("error");
        setMessage("Bu dosya açılamadı. JPG ya da PNG bir fotoğraf dene.");
      });
  }

  function reset() {
    stopCamera();
    setResult(null);
    setStatus("idle");
    setMessage("");
  }

  const showCanvas = status === "analyzing" || status === "done";

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-stone-900">Fotoğrafla analiz</h3>
        {status !== "idle" && (
          <button type="button" onClick={reset} className="text-xs text-stone-500 hover:text-stone-900">
            Sıfırla
          </button>
        )}
      </div>

      {(status === "idle" || status === "error") && (
        <>
          <p className="text-sm text-stone-600">
            Gün ışığında, makyajsız ve gözlüksüz çekilmiş bir fotoğraf en doğru sonucu verir. Fotoğrafın cihazında
            işlenir, hiçbir yere yüklenmez.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm text-white hover:bg-stone-700"
            >
              Fotoğraf yükle
            </button>
            <button
              type="button"
              onClick={openCamera}
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 hover:border-stone-900"
            >
              Kamerayı aç
            </button>
          </div>
          {message && <p className="text-sm text-red-700">{message}</p>}
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      {status === "camera" && (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-2xl bg-stone-900">
            <video ref={videoRef} autoPlay playsInline muted className="aspect-[4/3] w-full -scale-x-100 object-cover" />
            <div className="pointer-events-none absolute inset-[18%_25%] rounded-[50%] border-2 border-white/60" />
          </div>
          <button
            type="button"
            onClick={capture}
            className="w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm text-white hover:bg-stone-700"
          >
            Çek ve analiz et
          </button>
        </div>
      )}

      <div className={showCanvas ? "relative" : "hidden"}>
        <canvas ref={canvasRef} className="max-h-72 w-full rounded-2xl bg-stone-100 object-contain" />
        {status === "analyzing" && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-white/60 text-sm text-stone-700">
            Analiz ediliyor…
          </div>
        )}
      </div>

      {status === "done" && result && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {(
              [
                ["Ten", result.skin.hex],
                ["Saç", result.hair.hex],
                ["Göz", result.eyes.hex],
              ] as const
            ).map(([label, hex]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="size-6 rounded-full border border-black/10" style={{ background: hex }} />
                <span className="text-xs text-stone-600">{label}</span>
              </div>
            ))}
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">
              Göz: {result.eyes.group.name}
            </span>

          </div>
          <p className="text-xs text-stone-500 tabular-nums">
            Ton açısı {result.reading.hue.toFixed(0)}°, doygunluk {result.reading.chroma.toFixed(0)}
                      </p>
          <p className="text-xs text-stone-500">
            Ölçümü kendi fotoğraflarınla da deneyebilirsin:{" "}
            <a href="/kalibrasyon" className="underline hover:text-stone-900">
              Tahmini kendi fotoğraflarınla test et
            </a>
          </p>
          <p className="text-xs text-stone-500">
            Ölçülen ten, saç ve göz rengi işlendi. Fotoğraf alt tonu güvenilir göstermiyor (396 uzman etiketli
            fotoğrafla yaptığımız testte şans seviyesinde kaldı); alt tonun için 2. ve 3. adımları kullan.
            {result.lightCorrected && " Fotoğraftaki sarı/mavi ışık kayması göz beyazına göre düzeltildi."}
          </p>
        </div>
      )}
    </section>
  );
}
