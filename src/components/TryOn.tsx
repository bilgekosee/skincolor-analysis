"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { applyUndertone, hexToLab, seasonFor, toLch, UNDERTONES, type Undertone } from "@/lib/color";
import type { AnalysisResult } from "@/lib/colorAnalysis";
import type { DrapeImage } from "@/lib/faceDetection";
import { combineEvidence, type DrapeAnswers, type DrapeChoice } from "@/lib/evidence";
import {
  BROWS,
  CONTOUR,
  EYE_GROUPS,
  LINERS,
  METALS,
  MONK,
  NAT_HAIR,
  QUIZ,
  SEASONS,
  type MetalId,
  type QuizState,
  type SeasonKey,
} from "@/lib/palettes";
import type { AvatarLook, Gender, Makeup, Neckline } from "./viewer/Avatar";
import type { View } from "./viewer/Scene";
import SeasonGuideView from "./SeasonGuide";
import { SEASON_GUIDES } from "@/lib/seasonGuide";

const DrapeTest = dynamic(() => import("./analysis/DrapeTest"), { ssr: false });

const PhotoAnalyzer = dynamic(() => import("./analysis/PhotoAnalyzer"), { ssr: false });

const Scene = dynamic(() => import("./viewer/Scene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-sm text-white">Yükleniyor…</div>,
});

type Tab = "makeup" | "outfit" | "hair" | "jewelry" | "eyes";

const TABS: [Tab, string][] = [
  ["makeup", "Makyaj"],
  ["outfit", "Kıyafet"],
  ["hair", "Saç"],
  ["jewelry", "Takı"],
  ["eyes", "Göz"],
];

const FEMALE_MAKEUP = { lipAmt: 0.55, blushAmt: 0.35, shadowAmt: 0.45, linerAmt: 0.6 };
const MALE_MAKEUP = { lipAmt: 0, blushAmt: 0, shadowAmt: 0, linerAmt: 0 };

const DEPTH_LABEL = { light: "Açık", medium: "Orta", deep: "Koyu" };

const sameHex = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/* ---------- small UI pieces ---------- */

function Swatch({
  hex,
  pressed,
  onClick,
  avoid = false,
  label,
}: {
  hex: string;
  pressed: boolean;
  onClick: () => void;
  avoid?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      title={label ?? hex}
      aria-label={label ?? hex}
      aria-pressed={pressed}
      onClick={onClick}
      className={`relative size-[30px] rounded-lg border border-black/10 ${
        pressed ? "outline-2 outline-offset-2 outline-[#6b2d5c]" : ""
      }`}
      style={{ background: hex }}
    >
      {avoid && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-[inherit]"
          style={{
            background:
              "linear-gradient(135deg,transparent 46%,rgba(255,255,255,.9) 46%,rgba(255,255,255,.9) 54%,transparent 54%)",
          }}
        />
      )}
    </button>
  );
}

function Chip({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
        pressed ? "border-[#6b2d5c] bg-[#6b2d5c] text-white" : "border-stone-200 text-stone-800 hover:border-stone-400"
      }`}
    >
      {label}
    </button>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-full bg-white/90 p-[3px]">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
            value === id ? "bg-stone-800 text-white" : "text-stone-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-stone-200 px-5 py-4 first:border-t-0">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-stone-900">
        <span className="rounded-md bg-[#f1e6ee] px-1.5 text-xs font-semibold text-[#6b2d5c] tabular-nums">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const Sub = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11.5px] tracking-wide text-stone-500 uppercase">{children}</div>
);

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3">
      <span className="min-w-14 text-xs text-stone-500">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="flex-1 accent-[#6b2d5c]"
      />
    </label>
  );
}

function ColorPicker({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  return (
    <input
      type="color"
      value={value}
      aria-label={label}
      title={label}
      onChange={(e) => onChange(e.target.value)}
      className="size-[30px] cursor-pointer rounded-lg border border-stone-200 bg-transparent p-0"
    />
  );
}

function Category({
  title,
  colors,
  value,
  onPick,
  sub,
  avoid,
  amount,
  children,
}: {
  title: string;
  colors: string[];
  value: string;
  onPick: (hex: string) => void;
  sub?: string;
  avoid?: string[];
  amount?: { value: number; onChange: (v: number) => void };
  children?: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-dashed border-stone-200 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-[13.5px] font-semibold">{title}</strong>
        <ColorPicker value={value} onChange={onPick} label={`${title}: serbest renk`} />
      </div>
      {sub && <Sub>{sub}</Sub>}
      <div className="flex flex-wrap gap-1.5">
        {colors.map((h) => (
          <Swatch key={h} hex={h} pressed={sameHex(value, h)} onClick={() => onPick(h)} />
        ))}
      </div>
      {avoid && (
        <>
          <Sub>Sezonuna uymayan, farkı görmek için dene</Sub>
          <div className="flex flex-wrap gap-1.5">
            {avoid.map((h) => (
              <Swatch key={h} hex={h} avoid pressed={sameHex(value, h)} onClick={() => onPick(h)} />
            ))}
          </div>
        </>
      )}
      {amount && <Slider label="Yoğunluk" value={amount.value} onChange={amount.onChange} />}
      {children}
    </div>
  );
}

/* ---------- main ---------- */

type State = {
  gender: Gender;
  view: View;
  monk: number;
  skinHex: string;
  // A colour measured from a photo already carries its undertone; don't shift it again.
  skinMeasured: boolean;
  natHairName: string | null;
  natHairHex: string;
  // Chosen by hand; only used while utManual is true, otherwise the evidence decides.
  ut: Undertone;
  utManual: boolean;
  quiz: QuizState;
  photo: DrapeImage | null;
  photoReading: { hue: number } | null;
  drape: DrapeAnswers;
  makeup: Makeup;
  top: string;
  neckline: Neckline;
  hair: string;
  eye: string;
  metal: MetalId;
  earrings: boolean;
  necklace: boolean;
  tab: Tab;
  // The season whose palette is currently on the model.
  appliedSeason: SeasonKey | null;
};

const verdictOf = (st: State) => combineEvidence({ photo: st.photoReading, quiz: st.quiz, drape: st.drape });
const utOf = (st: State) => (st.utManual ? st.ut : (verdictOf(st)?.undertone ?? st.ut));
const skinOf = (st: State) => (st.skinMeasured ? st.skinHex : applyUndertone(st.skinHex, utOf(st)).hex);
const seasonOf = (st: State) => seasonFor(skinOf(st), st.natHairHex, utOf(st), verdictOf(st)?.highContrast ?? null);

function withPalette(st: State): State {
  const key = seasonOf(st).key;
  const z = SEASONS[key];
  return {
    ...st,
    top: z.clothes[0],
    metal: z.metal,
    makeup: { ...st.makeup, lip: z.lips[0], blush: z.blush[0], shadow: z.shadow[0] },
    appliedSeason: key,
  };
}

// Whenever skin, hair or undertone moves the user into another season, dress the model in it.
function settle(prev: State, next: State): State {
  return seasonOf(next).key === seasonOf(prev).key ? next : withPalette(next);
}

const BASE: State = {
  gender: "female",
  view: "front",
  monk: 3,
  skinHex: MONK[3],
  skinMeasured: false,
  natHairName: "Kahve",
  natHairHex: NAT_HAIR.Kahve,
  ut: "neutral",
  utManual: false,
  quiz: [null, null, null, null],
  photo: null,
  photoReading: null,
  drape: {},
  makeup: {
    lip: "#c97c74",
    gloss: 0.4,
    blush: "#e09a8c",
    shadow: "#9a8270",
    liner: "#141010",
    brow: "#3b2a1e",
    browAmt: 0.8,
    contour: "#b08b74",
    contourAmt: 0,
    ...FEMALE_MAKEUP,
  },
  top: "#4f6d7a",
  neckline: "vneck",
  hair: "#5c4030",
  eye: EYE_GROUPS[1].hex,
  metal: "gold",
  earrings: true,
  necklace: true,
  tab: "makeup",
  appliedSeason: null,
};

const INITIAL = withPalette(BASE);

export default function TryOn() {
  const [s, setS] = useState<State>(INITIAL);
  const set = (patch: Partial<State>) => setS((prev) => settle(prev, { ...prev, ...patch }));
  const setMakeup = (patch: Partial<Makeup>) => setS((prev) => ({ ...prev, makeup: { ...prev.makeup, ...patch } }));

  const ut = utOf(s);
  const verdict = verdictOf(s);
  const shifted = applyUndertone(s.skinHex, ut);
  const skinFinal = skinOf(s);
  const season = seasonOf(s);
  const z = SEASONS[season.key];
  const baseHue = toLch(hexToLab(s.skinHex))[2];

  const look: AvatarLook = {
    gender: s.gender,
    neckline: s.neckline,
    skin: skinFinal,
    hair: s.hair,
    eyes: s.eye,
    top: s.top,
    metalHex: METALS[s.metal].hex,
    earrings: s.earrings,
    necklace: s.necklace,
    makeup: s.makeup,
  };

  function switchGender(gender: Gender) {
    setS((prev) => ({
      ...prev,
      gender,
      view: "front",
      earrings: gender === "female",
      hair: gender === "male" ? "#3b2a1e" : prev.hair,
      makeup: { ...prev.makeup, ...(gender === "male" ? MALE_MAKEUP : FEMALE_MAKEUP) },
    }));
  }

  function answerQuiz(index: number, value: QuizState[number]) {
    setS((prev) => {
      const quiz = prev.quiz.map((v, i) => (i === index ? value : v));
      return settle(prev, { ...prev, quiz, utManual: false });
    });
  }

  function applySeason() {
    setS((prev) => withPalette(prev));
  }

  function answerDrape(id: string, choice: DrapeChoice) {
    setS((prev) => settle(prev, { ...prev, drape: { ...prev.drape, [id]: choice }, utManual: false }));
  }

  function applyAnalysis(result: AnalysisResult, photo: DrapeImage) {
    // Always land on the measured season's palette, even if it matches the previous one.
    setS((prev) => withPalette({
      ...prev,
      monk: -1,
      skinHex: result.skin.hex,
      skinMeasured: true,
      natHairName: null,
      natHairHex: result.hair.hex,
      hair: result.hair.hex,
      eye: result.eyes.group.hex,
      photo,
      photoReading: { hue: result.reading.hue },
      utManual: false,
    }));
  }

  // Picking a swatch with its amount near zero would look like nothing happened.
  const withAmount = (key: "lipAmt" | "blushAmt" | "shadowAmt" | "linerAmt" | "contourAmt" | "browAmt") => ({
    value: s.makeup[key],
    onChange: (v: number) => setMakeup({ [key]: v }),
  });
  const pickMakeup =
    (color: keyof Makeup, amt?: keyof Makeup) =>
    (hex: string) =>
      setMakeup(amt && (s.makeup[amt] as number) < 0.15 ? { [color]: hex, [amt]: 0.6 } : { [color]: hex });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="relative h-[62vh] min-h-[420px] overflow-hidden rounded-3xl bg-[#8a8a8c] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <Scene look={look} view={s.view} />
        <div className="absolute top-3.5 right-3.5 left-3.5 flex flex-wrap gap-2">
          <Segmented
            options={[
              ["female", "Kadın"],
              ["male", "Erkek"],
            ]}
            value={s.gender}
            onChange={switchGender}
          />
          <Segmented
            options={[
              ["front", "Önden"],
              ["side", "Yandan"],
              ["close", "Yakın"],
            ]}
            value={s.view}
            onChange={(view) => set({ view })}
          />
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3.5 text-xs text-white/90">
          Sürükleyerek döndür · kaydırarak yaklaş · arka plan nötr gri
        </div>
      </div>

      <aside className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <Step n={1} title="Ten rengin">
          <PhotoAnalyzer onResult={applyAnalysis} />
          <p className="text-[13px] text-stone-500">
            Ya da Monk Skin Tone ölçeğinden seç: 1 en açık, 10 en koyu. Kendi tonun için renk seçiciyi kullan.
          </p>
          <div className="flex gap-[5px] pb-3.5">
            {MONK.map((hex, i) => (
              <button
                key={hex}
                type="button"
                aria-label={`Monk ${i + 1}`}
                aria-pressed={s.monk === i}
                onClick={() => set({ monk: i, skinHex: hex, skinMeasured: false })}
                className={`relative h-[38px] w-[29px] rounded-[7px] border border-black/10 ${
                  s.monk === i ? "outline-2 outline-offset-2 outline-[#6b2d5c]" : ""
                }`}
                style={{ background: hex }}
              >
                <span className="absolute inset-x-0 -bottom-[17px] text-center text-[10px] text-stone-500 tabular-nums">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3">
            <span className="min-w-14 text-xs text-stone-500">Özel ton</span>
            <ColorPicker
              value={s.skinHex}
              label="Özel ten rengi"
              onChange={(hex) => set({ monk: -1, skinHex: hex, skinMeasured: false })}
            />
            {s.skinMeasured && <span className="text-xs text-stone-500">Fotoğraftan ölçüldü</span>}
          </label>
          <Sub>Doğal saç rengin</Sub>
          <div className="flex flex-wrap gap-1.5">
            {s.natHairName === null && <Chip label="Fotoğraftan" pressed onClick={() => {}} />}
            {Object.entries(NAT_HAIR).map(([name, hex]) => (
              <Chip
                key={name}
                label={name}
                pressed={s.natHairName === name}
                onClick={() => set({ natHairName: name, natHairHex: hex })}
              />
            ))}
          </div>
        </Step>

        <Step n={2} title="Alt tonun">
          {QUIZ.map((q, qi) => (
            <div key={q.q} className="grid gap-1.5">
              <p className="text-[13.5px]">{q.q}</p>
              <div className="flex flex-wrap gap-1.5">
                {q.a.map(([label, value]) => (
                  <Chip key={label} label={label} pressed={s.quiz[qi] === value} onClick={() => answerQuiz(qi, value)} />
                ))}
              </div>
            </div>
          ))}
        </Step>

        <Step n={3} title="Renk kartı testi">
          <DrapeTest photo={s.photo} answers={s.drape} onAnswer={answerDrape} />
        </Step>

        <Step n={4} title="Sonucun">
          {verdict ? (
            <div className="grid gap-2 rounded-xl border border-stone-200 px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-semibold">Alt ton: {UNDERTONES[ut].label}</span>
                {!s.utManual && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      verdict.confidence === "high"
                        ? "bg-emerald-100 text-emerald-800"
                        : verdict.confidence === "medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    Güven: {{ high: "yüksek", medium: "orta", low: "düşük" }[verdict.confidence]}
                  </span>
                )}
              </div>
              <ul className="grid gap-0.5 text-xs text-stone-600">
                {verdict.sources.map((src) => (
                  <li key={src.label} className="flex justify-between gap-2">
                    <span className="text-stone-500">{src.label}</span>
                    <span className="tabular-nums">{src.detail}</span>
                  </li>
                ))}
              </ul>
              {verdict.conflict && !s.utManual && (
                <p className="text-xs text-amber-800">
                  Kaynaklar farklı yönleri gösteriyor. Renk kartları en çok ağırlığı taşıyor; emin olmak için
                  testi gün ışığında tekrar yap.
                </p>
              )}
              {verdict.confidence !== "high" && !verdict.conflict && !s.utManual && (
                <p className="text-xs text-stone-500">Güveni artırmak için 3. adımdaki renk kartlarını tamamla.</p>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-stone-500">Alt ton için 2. adımdaki soruları ya da 3. adımdaki renk kartlarını doldur.</p>
          )}
          <Sub>Kendin seçmek istersen</Sub>
          <div className="flex flex-wrap gap-1.5">
            {!s.utManual ? (
              <Chip label="Otomatik" pressed onClick={() => {}} />
            ) : (
              <Chip label="Otomatik" pressed={false} onClick={() => set({ utManual: false })} />
            )}
            {(Object.keys(UNDERTONES) as Undertone[]).map((u) => (
              <Chip key={u} label={UNDERTONES[u].label} pressed={s.utManual && s.ut === u} onClick={() => set({ ut: u, utManual: true })} />
            ))}
          </div>
          {s.skinMeasured ? (
            <p className="text-xs text-stone-500">
              Fotoğraftan ölçülen ten zaten kendi alt tonunu taşıyor; alt ton yalnızca sezon hesabında kullanılıyor.
            </p>
          ) : (
            <div className="flex items-center gap-2 text-xs text-stone-500">
              Seçilen ton
              <i className="inline-block size-[22px] rounded-md border border-black/10" style={{ background: s.skinHex }} />
              alt tonla
              <i className="inline-block size-[22px] rounded-md border border-black/10" style={{ background: shifted.hex }} />
              <span className="tabular-nums">
                ton açısı {baseHue.toFixed(0)}° → {shifted.lch[2].toFixed(0)}°
              </span>
            </div>
          )}
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3.5 gap-y-1 rounded-xl bg-[#f1e6ee] px-3.5 py-3">
            <div className="col-span-2 text-xl leading-tight font-bold">
              {z.name} <span className="text-[13px] font-medium text-stone-500">{z.en}</span>
            </div>
            <dt className="text-xs text-stone-500">Alt ton</dt>
            <dd className="text-[13px]">{UNDERTONES[ut].label}</dd>
            <dt className="text-xs text-stone-500">Genel derinlik</dt>
            <dd className="text-[13px] tabular-nums">
              {DEPTH_LABEL[season.depth]} · ten L {season.L.toFixed(0)}, saç L {season.Lh.toFixed(0)}
            </dd>
            <dt className="text-xs text-stone-500">Saç ten kontrastı</dt>
            <dd className="text-[13px] tabular-nums">
              {season.high ? "Yüksek" : "Düşük"} · ΔL {Math.abs(season.L - season.Lh).toFixed(0)}
              {verdict?.highContrast !== null && verdict?.highContrast !== undefined && " · renk kartlarından"}
            </dd>
            <dt className="text-xs text-stone-500">Metal</dt>
            <dd className="text-[13px]">{METALS[z.metal].label}</dd>
          </dl>
          {s.appliedSeason !== season.key && (
            <p className="text-[13px] text-amber-800">Sezonun değişti; aşağıdaki renkler modelde değil, uygulamak için düğmeye bas.</p>
          )}
          <SeasonGuideView
            season={z}
            guide={SEASON_GUIDES[season.key]}
            why={`Alt tonun ${UNDERTONES[ut].label.toLowerCase()}, genel derinliğin ${DEPTH_LABEL[season.depth].toLowerCase()}, saç–ten kontrastın ${season.high ? "yüksek" : "düşük"}; bu yüzden ${z.name}.`}
            value={{ top: s.top, lip: s.makeup.lip, blush: s.makeup.blush, shadow: s.makeup.shadow, hair: s.hair }}
            onPick={{
              top: (top) => set({ top }),
              lip: pickMakeup("lip", "lipAmt"),
              blush: pickMakeup("blush", "blushAmt"),
              shadow: pickMakeup("shadow", "shadowAmt"),
              hair: (hair) => set({ hair }),
            }}
          />
          {s.appliedSeason !== season.key && (
            <button
              type="button"
              onClick={applySeason}
              className="justify-self-start rounded-[10px] bg-[#6b2d5c] px-3.5 py-2 text-[13px] font-semibold text-white"
            >
              Sezon paletini modele uygula
            </button>
          )}
        </Step>

        <Step n={5} title="Dene">
          <div role="tablist" className="flex flex-wrap gap-1">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={s.tab === id}
                onClick={() => set({ tab: id })}
                className={`rounded-lg px-2.5 py-1.5 text-[13px] font-semibold ${
                  s.tab === id ? "bg-[#f1e6ee] text-[#6b2d5c]" : "text-stone-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            {s.tab === "makeup" && (
              <>
                {s.gender === "male" && (
                  <p className="text-[13px] text-stone-500">
                    Erkek modelde makyaj varsayılan olarak kapalı, istersen yoğunlukları açabilirsin.
                  </p>
                )}
                <Category
                  title="Ruj"
                  colors={z.lips}
                  value={s.makeup.lip}
                  onPick={pickMakeup("lip", "lipAmt")}
                  sub={`${z.name} için önerilen`}
                  amount={withAmount("lipAmt")}
                >
                  <Slider label="Parlaklık" value={s.makeup.gloss} onChange={(gloss) => setMakeup({ gloss })} />
                </Category>
                <Category
                  title="Allık"
                  colors={z.blush}
                  value={s.makeup.blush}
                  onPick={pickMakeup("blush", "blushAmt")}
                  amount={withAmount("blushAmt")}
                />
                <Category
                  title="Far"
                  colors={z.shadow}
                  value={s.makeup.shadow}
                  onPick={pickMakeup("shadow", "shadowAmt")}
                  amount={withAmount("shadowAmt")}
                />
                <Category
                  title="Eyeliner"
                  colors={LINERS}
                  value={s.makeup.liner}
                  onPick={pickMakeup("liner", "linerAmt")}
                  amount={withAmount("linerAmt")}
                />
                <Category
                  title="Kontür"
                  colors={CONTOUR}
                  value={s.makeup.contour}
                  onPick={pickMakeup("contour", "contourAmt")}
                  amount={withAmount("contourAmt")}
                />
                <Category
                  title="Kaş"
                  colors={BROWS}
                  value={s.makeup.brow}
                  onPick={pickMakeup("brow", "browAmt")}
                  amount={withAmount("browAmt")}
                />
              </>
            )}

            {s.tab === "outfit" && (
              <>
                <div className="grid gap-2 border-b border-dashed border-stone-200 py-3">
                  <strong className="text-[13.5px] font-semibold">Yaka</strong>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip label="V yaka" pressed={s.neckline === "vneck"} onClick={() => set({ neckline: "vneck" })} />
                    <Chip
                      label="Balıkçı yaka"
                      pressed={s.neckline === "turtle"}
                      onClick={() => set({ neckline: "turtle" })}
                    />
                  </div>
                </div>
                <Category
                  title="Üst renk"
                  colors={z.clothes}
                  value={s.top}
                  onPick={(top) => set({ top })}
                  sub={`${z.name} için önerilen`}
                  avoid={z.avoid}
                />
              </>
            )}

            {s.tab === "hair" && (
              <>
                <Category
                  title="Saç rengi"
                  colors={z.hair}
                  value={s.hair}
                  onPick={(hair) => set({ hair })}
                  sub={`${z.name} için önerilen`}
                />
                <Category
                  title="Doğal tonlar"
                  colors={Object.values(NAT_HAIR)}
                  value={s.hair}
                  onPick={(hair) => set({ hair })}
                />
              </>
            )}

            {s.tab === "jewelry" && (
              <div className="grid gap-2 py-3">
                <strong className="text-[13.5px] font-semibold">Metal</strong>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(METALS) as MetalId[]).map((id) => (
                    <Chip
                      key={id}
                      label={METALS[id].label + (id === z.metal ? " · önerilen" : "")}
                      pressed={s.metal === id}
                      onClick={() => set({ metal: id })}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip label="Küpe" pressed={s.earrings} onClick={() => set({ earrings: !s.earrings })} />
                  {s.gender === "female" && (
                    <Chip label="Kolye" pressed={s.necklace} onClick={() => set({ necklace: !s.necklace })} />
                  )}
                </div>
                {s.gender === "female" && s.neckline === "turtle" && s.necklace && (
                  <p className="text-[13px] text-stone-500">Kolye balıkçı yakanın altında kalıyor, görmek için V yakaya geç.</p>
                )}
              </div>
            )}

            {s.tab === "eyes" && (
              <Category title="Göz rengi" colors={EYE_GROUPS.map((g) => g.hex)} value={s.eye} onPick={(eye) => set({ eye })} />
            )}
          </div>
        </Step>

        <footer className="border-t border-stone-200 px-5 pt-3.5 pb-5 text-[11.5px] text-stone-500">
          İnsan modelleri Blender Studio Human Base Meshes, CC0. Kaş tel konumları Daniel Bystedt, Blender demo
          dosyası Hair Styles, CC BY-SA. Saçlar Laflian ve 3d-souemonks, CGTrader, Royalty Free. Monk Skin Tone ölçeği
          Google, Dr. Ellis Monk.
        </footer>
      </aside>
    </div>
  );
}
