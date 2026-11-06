"use client";

import { colorNames } from "@/lib/colorNames";
import { METALS, type Season } from "@/lib/palettes";
import type { SeasonGuide } from "@/lib/seasonGuide";

const sameHex = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function NamedSwatch({
  hex,
  name,
  pressed,
  onClick,
  avoid = false,
}: {
  hex: string;
  name: string;
  pressed: boolean;
  onClick: () => void;
  avoid?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={pressed}
      title={`${name} · ${hex}`}
      onClick={onClick}
      className="grid justify-items-center gap-1"
    >
      <span
        className={`relative block size-9 rounded-lg border border-black/10 ${
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
      </span>
      <span className="w-14 text-center text-[10px] leading-tight text-stone-600">{name}</span>
    </button>
  );
}

function SwatchGrid({
  colors,
  value,
  onPick,
  avoid,
}: {
  colors: string[];
  value: string;
  onPick: (hex: string) => void;
  avoid?: boolean;
}) {
  const names = colorNames(colors);
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-x-1 gap-y-2">
      {colors.map((h, i) => (
        <NamedSwatch key={h} hex={h} name={names[i]} avoid={avoid} pressed={sameHex(value, h)} onClick={() => onPick(h)} />
      ))}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2 border-t border-dashed border-stone-200 pt-3">
      <h3 className="text-[13.5px] font-semibold text-stone-900">{title}</h3>
      {children}
    </section>
  );
}

const Note = ({ label, children }: { label?: string; children: React.ReactNode }) => (
  <p className="text-[13px] leading-relaxed text-stone-600">
    {label && <span className="font-medium text-stone-800">{label}: </span>}
    {children}
  </p>
);

export default function SeasonGuideView({
  season,
  guide,
  why,
  value,
  onPick,
}: {
  season: Season;
  guide: SeasonGuide;
  // Sentence built from the user's own measurements.
  why: string;
  value: { top: string; lip: string; blush: string; shadow: string; hair: string };
  onPick: {
    top: (hex: string) => void;
    lip: (hex: string) => void;
    blush: (hex: string) => void;
    shadow: (hex: string) => void;
    hair: (hex: string) => void;
  };
}) {
  return (
    <div className="grid gap-3">
      <Note>
        {why} {guide.essence}
      </Note>
      <p className="text-xs text-stone-500">Renklere dokununca modelde görürsün.</p>

      <Block title="Kıyafet">
        <Note label="Temel nötrler">{guide.clothes.neutrals}</Note>
        <SwatchGrid colors={season.clothes.slice(0, 4)} value={value.top} onPick={onPick.top} />
        <Note label="Ana renkler">{guide.clothes.colors}</Note>
        <SwatchGrid colors={season.clothes.slice(4)} value={value.top} onPick={onPick.top} />
        <Note label="İpucu">{guide.clothes.tip}</Note>
      </Block>

      <Block title="Uzak durman gerekenler">
        <SwatchGrid colors={season.avoid} value={value.top} onPick={onPick.top} avoid />
        <Note>{guide.avoid} Farkı görmek için birine dokun.</Note>
      </Block>

      <Block title="Saç">
        <SwatchGrid colors={season.hair} value={value.hair} onPick={onPick.hair} />
        <Note label="Önerilen">{guide.hair.best}</Note>
        <Note label="Kaçın">{guide.hair.avoid}</Note>
      </Block>

      <Block title="Makyaj">
        <Note label="Ruj">{guide.makeup.lips}</Note>
        <SwatchGrid colors={season.lips} value={value.lip} onPick={onPick.lip} />
        <Note label="Allık">{guide.makeup.blush}</Note>
        <SwatchGrid colors={season.blush} value={value.blush} onPick={onPick.blush} />
        <Note label="Göz">{guide.makeup.eyes}</Note>
        <SwatchGrid colors={season.shadow} value={value.shadow} onPick={onPick.shadow} />
      </Block>

      <Block title="Takı">
        <Note label={`Önerilen metal: ${METALS[season.metal].label}`}>{guide.jewelry}</Note>
      </Block>

      <Block title="Kombin fikirleri">
        <ul className="grid list-disc gap-1 pl-5 text-[13px] text-stone-600">
          {guide.combos.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Block>
    </div>
  );
}
