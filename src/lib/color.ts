import type { SeasonKey } from "./palettes";

// sRGB <-> Lab <-> LCh, D65. Ported from deneme_sayfasi.html.

export type Lab = [L: number, a: number, b: number];
export type Lch = [L: number, C: number, H: number];

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

export function rgbToHex(rgb: number[]) {
  return (
    "#" +
    rgb
      .map((v) =>
        Math.round(Math.min(1, Math.max(0, v)) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export function linearRgbToLab([r, g, b]: number[]): Lab {
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export const linearRgbToHex = (rgb: number[]) => rgbToHex(rgb.map((v) => gam(Math.max(0, v))));
export const srgbToLinear = lin;

export const hexToLab = (hex: string) => linearRgbToLab(hexToRgb(hex).map(lin));

export function labToHex([L, a, b]: Lab) {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const fi = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const x = fi(fx) * 0.95047;
  const y = fi(fy);
  const z = fi(fz) * 1.08883;
  const r = 3.2406 * x - 1.5372 * y - 0.4986 * z;
  const g = -0.9689 * x + 1.8758 * y + 0.0415 * z;
  const bl = 0.0557 * x - 0.204 * y + 1.057 * z;
  return linearRgbToHex([r, g, bl]);
}

export const toLch = ([L, a, b]: Lab): Lch => [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
export const fromLch = ([L, C, H]: Lch): Lab => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];

export type Undertone = "warm" | "neutralWarm" | "neutral" | "neutralCool" | "cool" | "olive";

// Keep lightness, pull hue toward the undertone's direction by `pull`.
// Key order is the order the UI lists them in.
export const UNDERTONES: Record<Undertone, { label: string; hue: number | null; pull: number; chroma: number }> = {
  warm: { label: "Sıcak", hue: 72, pull: 0.45, chroma: 1.06 },
  neutralWarm: { label: "Nötr-sıcak", hue: 72, pull: 0.2, chroma: 1.03 },
  neutral: { label: "Nötr", hue: null, pull: 0, chroma: 1 },
  neutralCool: { label: "Nötr-soğuk", hue: 32, pull: 0.2, chroma: 0.99 },
  cool: { label: "Soğuk", hue: 32, pull: 0.45, chroma: 0.98 },
  olive: { label: "Zeytin", hue: 96, pull: 0.45, chroma: 0.86 },
};

export function applyUndertone(hex: string, ut: Undertone) {
  const lch = toLch(hexToLab(hex));
  const u = UNDERTONES[ut];
  if (u.hue !== null) {
    const d = ((u.hue - lch[2] + 540) % 360) - 180;
    lch[2] += d * u.pull;
  }
  lch[1] *= u.chroma;
  return { hex: labToHex(fromLch(lch)), lch };
}

// Undertone from a measured skin colour, by CIELAB hue angle.
//
// In the PANTONE SkinTone Guide converted to CIELAB, the yellow (warm) and
// red (cool) undertone groups split at a 60° hue angle (Brief overview of
// PANTONE SkinTone Guide chart in CIELab, 2018). Around that line we keep a
// narrow neutral band and, either side of it, "neutral-cool" and
// "neutral-warm" leanings, as 12-season colour analysis does. Olive is a
// yellow-leaning hue with muted chroma. Photos are not calibrated
// measurements; tune these against known photos on the /kalibrasyon page.
export const UNDERTONE_BANDS = [
  { undertone: "cool", below: 50 },
  { undertone: "neutralCool", below: 57 },
  { undertone: "neutral", below: 63 },
  { undertone: "neutralWarm", below: 70 },
  { undertone: "warm", below: Infinity },
] as const satisfies readonly { undertone: Undertone; below: number }[];
const OLIVE_MAX_CHROMA = 14;

export type UndertoneReading = {
  undertone: Undertone;
  hue: number;
  chroma: number;
  // Within 1.5° of a band edge: the photo can't really tell.
  borderline: boolean;
};

export function readUndertone(lab: Lab): UndertoneReading {
  const [, C, H] = toLch(lab);
  let undertone: Undertone = UNDERTONE_BANDS.find((b) => H < b.below)!.undertone;
  if (H > 60 && H < 100 && C < OLIVE_MAX_CHROMA) undertone = "olive";
  const borderline = UNDERTONE_BANDS.some((b) => Math.abs(H - b.below) < 1.5);
  return { undertone, hue: H, chroma: C, borderline };
}

// "soğuk <50° · nötr-soğuk 50–57° · …" for showing the scale next to a reading.
export function describeBands() {
  return UNDERTONE_BANDS.map((b, i) => {
    const label = UNDERTONES[b.undertone].label.toLowerCase();
    const from = i === 0 ? null : UNDERTONE_BANDS[i - 1].below;
    if (from === null) return `${label} <${b.below}°`;
    if (b.below === Infinity) return `${label} >${from}°`;
    return `${label} ${from}–${b.below}°`;
  }).join(" · ");
}

export const classifyUndertone = (lab: Lab) => readUndertone(lab).undertone;

export type Depth = "light" | "medium" | "deep";

// `highContrast` lets the drape test override the measured hair–skin contrast.
export function seasonFor(skinHex: string, hairHex: string, ut: Undertone, highContrast: boolean | null = null) {
  const L = hexToLab(skinHex)[0];
  const Lh = hexToLab(hairHex)[0];
  let depth: Depth = L >= 74 ? "light" : L < 48 ? "deep" : "medium";
  // Overall depth is read from the whole colouring, not skin alone: light skin
  // with dark hair is not a "light" season.
  if (depth === "light" && Lh < 30) depth = "medium";
  const measuredHigh = Math.abs(L - Lh) >= 45;
  const high = highContrast ?? measuredHigh;
  // Light, soft and deep seasons are the neutral-leaning ones in 12-season analysis.
  const byDepth: Record<Undertone, (d: Depth, high: boolean) => SeasonKey> = {
    warm: (d, hi) => (d === "light" ? "LS" : d === "deep" ? "DA" : hi ? "WS" : "WA"),
    neutralWarm: (d, hi) => (d === "light" ? "LS" : d === "deep" ? "DA" : hi ? "WS" : "SA"),
    neutral: (d, hi) => (d === "light" ? "SS" : d === "deep" ? (hi ? "DW" : "DA") : "SA"),
    neutralCool: (d, hi) => (d === "light" ? "LSu" : d === "deep" ? "DW" : hi ? "CW" : "SS"),
    cool: (d, hi) => (d === "light" ? "LSu" : d === "deep" ? "DW" : hi ? "CW" : "CS"),
    olive: (d) => (d === "light" ? "SS" : d === "deep" ? "DA" : "SA"),
  };
  const key = byDepth[ut](depth, high);
  return { key, depth, high, measuredHigh, L, Lh };
}
