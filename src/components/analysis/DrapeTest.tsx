"use client";

import { useEffect, useId, useState } from "react";
import { DRAPE_PAIRS, type DrapeAnswers, type DrapeChoice, type DrapeOption } from "@/lib/evidence";
import type { DrapeImage } from "@/lib/faceDetection";

// Digital draping: the user's own photo on neutral grey, their clothes
// recoloured and a round neckline of each colour under the chin, hair on
// top, like fabric held up in a mirror. The user, not the algorithm, judges
// which one flatters them.
//
// Default view swaps the two colours in one place, like an analyst flipping
// fabric under the chin: the eye catches a change in the same spot far more
// easily than it compares two pictures side by side.

type Mode = "flip" | "side";
type Side = "a" | "b";

const FLIP_MS = 1200;

function DrapeFrame({
  photo,
  option,
  zoom,
}: {
  photo: DrapeImage;
  option: DrapeOption;
  zoom: boolean;
}) {
  const id = useId();
  const fill = option.stops ? `url(#${id}-metal)` : option.background;
  return (
    <svg
      viewBox={zoom ? photo.zoom : `0 0 ${photo.width} ${photo.height}`}
      preserveAspectRatio="xMidYMid slice"
      className="block aspect-[4/5] w-full rounded-xl"
      role="img"
      aria-label={`${option.name} kumaş`}
    >
      <defs>
        {option.stops && (
          <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
            {option.stops.map((c, i) => (
              <stop key={i} offset={i / (option.stops!.length - 1)} stopColor={c} />
            ))}
          </linearGradient>
        )}
        {/* Soft fold shading so the colour reads as fabric, not a flat cut-out. */}
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <stop offset="0.08" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <image href={photo.src} width={photo.width} height={photo.height} />
      {photo.clothes && (
        <>
          <mask id={`${id}-clothes`}>
            <image href={photo.clothes} width={photo.width} height={photo.height} />
          </mask>
          {/* The user's own top, recoloured. */}
          <rect width={photo.width} height={photo.height} fill={fill} mask={`url(#${id}-clothes)`} />
        </>
      )}
      <path d={photo.cape} fill={fill} />
      <path d={photo.cape} fill={`url(#${id}-shade)`} />
      {/* Hair on top, so it falls over the fabric like it would in a mirror. */}
      {photo.hair && <image href={photo.hair} width={photo.width} height={photo.height} />}
    </svg>
  );
}

function Checklist() {
  return (
    <details className="rounded-xl bg-stone-50 px-3 py-2 text-[13px] text-stone-600">
      <summary className="cursor-pointer font-medium text-stone-800">Nelere bakmalıyım?</summary>
      <div className="mt-2 grid gap-2">
        <div>
          <p className="font-medium text-emerald-800">Doğru renkte</p>
          <ul className="list-disc pl-5">
            <li>Göz altları ve ağız kenarındaki gölgeler hafifler</li>
            <li>Kızarıklıklar ve lekeler daha az belirgin olur</li>
            <li>Ten eşit, pürüzsüz ve canlı görünür; gözler parlar</li>
            <li>Önce yüzünü görürsün, renk arka planda kalır</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-red-800">Yanlış renkte</p>
          <ul className="list-disc pl-5">
            <li>Gölgeler koyulaşır, yüz yorgun ya da yaşlı görünür</li>
            <li>Ten sarıya, griye ya da fazla pembeye kayar</li>
            <li>Önce renk göze çarpar, yüz geride kalır</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-stone-800">İpuçları</p>
          <ul className="list-disc pl-5">
            <li>İlk 1–2 saniyedeki izlenim genelde en doğrusudur; uzun bakınca göz alışır</li>
            <li>Gözlerini hafifçe kıs: ayrıntı kaybolur, genel uyum öne çıkar</li>
            <li>Kıyafete ya da arka plana değil, sadece tene bak</li>
            <li>Ekranı orta parlaklıkta, gece modu ve mavi ışık filtresi kapalı kullan</li>
            <li>Emin olamıyorsan &quot;Fark göremiyorum&quot; de; bu da geçerli bir cevap</li>
          </ul>
        </div>
      </div>
    </details>
  );
}

export default function DrapeTest({
  photo,
  answers,
  onAnswer,
}: {
  photo: DrapeImage | null;
  answers: DrapeAnswers;
  onAnswer: (id: string, choice: DrapeChoice) => void;
}) {
  const firstOpen = DRAPE_PAIRS.findIndex((p) => !answers[p.id]);
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [mode, setMode] = useState<Mode>("flip");
  const [shown, setShown] = useState<Side>("a");
  const [auto, setAuto] = useState(true);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (mode !== "flip" || !auto) return;
    const id = setInterval(() => setShown((s) => (s === "a" ? "b" : "a")), FLIP_MS);
    return () => clearInterval(id);
  }, [mode, auto]);

  if (!photo) {
    return (
      <p className="text-[13px] text-stone-500">
        Önce 1. adımda fotoğraf yükle ya da kamerayla çek. Yüzün burada renklerin içinde görünecek.
      </p>
    );
  }

  const pair = DRAPE_PAIRS[index];
  const choice = answers[pair.id];
  const done = DRAPE_PAIRS.filter((p) => answers[p.id]).length;

  function goTo(i: number) {
    setIndex(i);
    setShown("a");
  }

  function pick(c: DrapeChoice) {
    onAnswer(pair.id, c);
    const next = DRAPE_PAIRS.findIndex((p, i) => i > index && !answers[p.id]);
    if (next !== -1) goTo(next);
    else if (index < DRAPE_PAIRS.length - 1) goTo(index + 1);
  }

  const toggle = (active: boolean, label: string, onClick: () => void) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs ${active ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="grid gap-3">
      <Checklist />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {toggle(mode === "flip", "Sırayla", () => setMode("flip"))}
          {toggle(mode === "side", "Yan yana", () => setMode("side"))}
        </div>
        <div className="flex gap-1">
          {mode === "flip" && toggle(auto, auto ? "Otomatik ❚❚" : "Otomatik ▶", () => setAuto(!auto))}
          {toggle(zoom, "Yakınlaştır", () => setZoom(!zoom))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {DRAPE_PAIRS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`${i + 1}. çift`}
              onClick={() => goTo(i)}
              className={`h-1.5 w-6 rounded-full ${
                i === index ? "bg-[#6b2d5c]" : answers[p.id] ? "bg-[#6b2d5c]/40" : "bg-stone-200"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-stone-500 tabular-nums">
          {done}/{DRAPE_PAIRS.length}
        </span>
      </div>

      <div>
        <p className="text-[13.5px] font-medium">{pair.question}</p>
        <p className="mt-1 text-[12.5px] text-stone-500">
          <span className="font-medium text-stone-700">Neye bak: </span>
          {pair.hint}
        </p>
      </div>

      {mode === "flip" ? (
        <button
          type="button"
          onClick={() => {
            setAuto(false);
            setShown(shown === "a" ? "b" : "a");
          }}
          aria-label="Rengi değiştir"
          className="relative rounded-2xl p-1.5 ring-1 ring-black/10"
        >
          <DrapeFrame photo={photo} option={pair[shown]} zoom={zoom} />
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-800">
            {shown === "a" ? "A" : "B"} · {pair[shown].name}
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {(["a", "b"] as const).map((side) => (
            <button
              key={side}
              type="button"
              aria-pressed={choice === side}
              onClick={() => pick(side)}
              className={`grid gap-1.5 rounded-2xl p-1.5 text-center ${
                choice === side ? "ring-2 ring-[#6b2d5c] ring-offset-2" : "ring-1 ring-black/10"
              }`}
            >
              <DrapeFrame photo={photo} option={pair[side]} zoom={zoom} />
              <span className="text-xs text-stone-700">
                {side === "a" ? "A" : "B"} · {pair[side].name}
              </span>
            </button>
          ))}
        </div>
      )}

      {mode === "flip" && (
        <p className="text-xs text-stone-500">
          Renkler kendiliğinden değişiyor; görüntüye dokunarak elle de değiştirebilirsin.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(["a", "b"] as const).map((side) => (
          <button
            key={side}
            type="button"
            aria-pressed={choice === side}
            onClick={() => pick(side)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] ${
              choice === side ? "border-[#6b2d5c] bg-[#f1e6ee] text-[#6b2d5c]" : "border-stone-200 text-stone-800"
            }`}
          >
            <span className="size-5 shrink-0 rounded-md border border-black/10" style={{ background: pair[side].background }} />
            <span>
              <span className="font-medium">{side === "a" ? "A" : "B"}</span> daha iyi
              <span className="block text-[11px] text-stone-500">{pair[side].name}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => pick("same")}
          aria-pressed={choice === "same"}
          className={`rounded-full border px-3 py-1 text-[13px] ${
            choice === "same" ? "border-[#6b2d5c] bg-[#6b2d5c] text-white" : "border-stone-200 text-stone-700"
          }`}
        >
          Fark göremiyorum
        </button>
        <div className="flex gap-2 text-xs text-stone-500">
          <button type="button" disabled={index === 0} onClick={() => goTo(index - 1)} className="disabled:opacity-40">
            ← Önceki
          </button>
          <button
            type="button"
            disabled={index === DRAPE_PAIRS.length - 1}
            onClick={() => goTo(index + 1)}
            className="disabled:opacity-40"
          >
            Sonraki →
          </button>
        </div>
      </div>
    </div>
  );
}
