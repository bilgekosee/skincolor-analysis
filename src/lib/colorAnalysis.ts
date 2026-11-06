import {
  labToHex,
  linearRgbToHex,
  linearRgbToLab,
  readUndertone,
  srgbToLinear,
  toLch,
  type Lab,
  type Undertone,
  type UndertoneReading,
} from "./color";
import { EYE_GROUPS, type EyeGroup } from "./palettes";

export type Point = { x: number; y: number };

export type Sample = { lab: Lab; hex: string; points: Point[] };

export type AnalysisResult = {
  skin: Sample;
  hair: Sample;
  eyes: Sample & { group: EyeGroup };
  undertone: Undertone;
  reading: UndertoneReading;
  // Face bounds in image pixels, for cropping the face into drape previews.
  faceBox: { x: number; y: number; w: number; h: number };
  // Lower face outline (ear to ear under the chin) in image pixels, where a
  // drape's neckline is drawn.
  jaw: Point[];
  lightCorrected: boolean;
};

// MediaPipe Face Landmarker indices (478-point mesh with irises).
const SKIN_POINTS = [50, 280, 117, 346, 205, 425, 151, 108, 337];
const FOREHEAD_TOP = 10;
const CHIN = 152;
const LEFT_TEMPLE = 103;
const RIGHT_TEMPLE = 332;
const FACE_LEFT = 234;
const FACE_RIGHT = 454;
// Face-oval landmarks from below the left ear, under the chin, to below the right ear.
const JAW = [132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361];
const IRISES = [
  { center: 468, edge: 469, corners: [33, 133] },
  { center: 473, edge: 474, corners: [362, 263] },
];

const median = (values: number[]) => {
  if (!values.length) return 0;
  const s = [...values].sort((p, q) => p - q);
  return s[Math.floor(s.length / 2)];
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const dist = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y);
const lerp = (p: Point, q: Point, t: number): Point => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
const deltaE = (p: Lab, q: Lab) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

type Pixels = { data: Uint8ClampedArray; width: number; height: number };

// Collects linear RGB pixels in an annulus around each point.
function collect(
  img: Pixels,
  points: Point[],
  outer: number,
  inner = 0,
  keep?: (dx: number, dy: number) => boolean,
) {
  const out: number[][] = [];
  for (const p of points) {
    const r = Math.max(1, Math.round(outer));
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > outer || d < inner || (keep && !keep(dx, dy))) continue;
        const x = Math.round(p.x + dx);
        const y = Math.round(p.y + dy);
        if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
        const i = (y * img.width + x) * 4;
        out.push([srgbToLinear(img.data[i] / 255), srgbToLinear(img.data[i + 1] / 255), srgbToLinear(img.data[i + 2] / 255)]);
      }
    }
  }
  return out;
}

// Median colour after dropping the darkest and brightest pixels (shadows, highlights).
// Colour of the pixels between two lightness quantiles. The default is a
// trimmed median; hair uses its lit part, since shadowed strands read far
// darker than the colour people perceive.
function robustColor(
  pixels: number[][],
  gains: number[],
  trim = 0.15,
  exclude?: (lab: Lab) => boolean,
  range?: [lo: number, hi: number],
) {
  let entries = pixels.map((p) => {
    const rgb = p.map((c, i) => Math.min(1, c * gains[i]));
    return { rgb, lab: linearRgbToLab(rgb) };
  });
  if (exclude) {
    const kept = entries.filter((e) => !exclude(e.lab));
    // Fall back to everything if the filter leaves too little to be meaningful.
    if (kept.length > entries.length * 0.15) entries = kept;
  }
  entries.sort((m, n) => m.lab[0] - n.lab[0]);
  const [lo, hi] = range ?? [trim, 1 - trim];
  const kept = entries.slice(Math.floor(entries.length * lo), Math.ceil(entries.length * hi)).map((e) => e.rgb);
  const rgb = range
    ? [0, 1, 2].map((i) => kept.reduce((sum, p) => sum + p[i], 0) / Math.max(kept.length, 1))
    : [0, 1, 2].map((i) => median(kept.map((p) => p[i])));
  return { rgb, lab: linearRgbToLab(rgb), hex: linearRgbToHex(rgb) };
}

export function analyzeFace(img: Pixels, landmarks: Point[]): AnalysisResult {
  const lm = landmarks.map((p) => ({ x: p.x * img.width, y: p.y * img.height }));
  const faceWidth = dist(lm[FACE_LEFT], lm[FACE_RIGHT]);

  let irisRadius = 0;
  const scleraPoints: Point[] = [];
  for (const iris of IRISES) {
    const r = dist(lm[iris.center], lm[iris.edge]);
    irisRadius += r / IRISES.length;
    for (const corner of iris.corners) {
      const c = lm[corner];
      if (dist(lm[iris.center], c) > r * 1.6) scleraPoints.push(lerp(lm[iris.center], c, 0.55));
    }
  }
  const gains = [1, 1, 1];

  // Light-cast correction from the sclera, yellow-blue axis only and at half
  // strength. The sclera is naturally pinkish (vessels, skin reflection), so
  // treating it as pure white strips the red out of the skin and turns cool
  // undertones warm. A healthy sclera sits near b* +4.
  let bShift = 0;
  const scleraPixels = collect(img, scleraPoints, Math.max(1.5, irisRadius * 0.3));
  if (scleraPixels.length > 8) {
    const sclera = robustColor(scleraPixels, gains, 0.25);
    const cast = sclera.lab[2] - 4;
    if (sclera.lab[0] > 50 && Math.abs(cast) > 4) bShift = clamp(cast * 0.5, -8, 8);
  }
  const correct = (c: { lab: Lab }) => {
    const lab: Lab = [c.lab[0], c.lab[1], c.lab[2] - bShift];
    return { lab, hex: labToHex(lab) };
  };

  const skinPoints = SKIN_POINTS.map((i) => lm[i]);
  const skin = correct(robustColor(collect(img, skinPoints, faceWidth * 0.025), gains));

  // Lower half of the iris only: the upper half sits in the eyelid's shadow.
  // Drop specular highlights / sclera (bright, colourless) and the pupil.
  const irisPoints = IRISES.map((i) => lm[i.center]);
  const eyes = correct(
    robustColor(
      collect(img, irisPoints, irisRadius * 0.9, irisRadius * 0.35, (_dx, dy) => dy > 0),
      gains,
      0,
      (lab) => (lab[0] > 72 && toLch(lab)[1] < 12) || lab[0] < 8,
      [0.4, 0.9],
    ),
  );

  const up = { x: lm[FOREHEAD_TOP].x - lm[CHIN].x, y: lm[FOREHEAD_TOP].y - lm[CHIN].y };
  const above = (p: Point, t: number) => ({ x: p.x + up.x * t, y: p.y + up.y * t });
  const hairPoints = [
    above(lm[FOREHEAD_TOP], 0.16),
    above(lm[LEFT_TEMPLE], 0.16),
    above(lm[RIGHT_TEMPLE], 0.16),
  ];
  // Hairlines vary, so drop pixels that look like the skin we already measured.
  const hair = correct(
    robustColor(
      collect(img, hairPoints, faceWidth * 0.05),
      gains,
      0.2,
      (lab) => deltaE(lab, skin.lab) < 14,
      [0.55, 0.9],
    ),
  );

  const reading = readUndertone(skin.lab);
  const xs = lm.map((p) => p.x);
  const ys = lm.map((p) => p.y);
  const faceBox = {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };

  return {
    skin: { lab: skin.lab, hex: skin.hex, points: skinPoints },
    hair: { lab: hair.lab, hex: hair.hex, points: hairPoints },
    eyes: { lab: eyes.lab, hex: eyes.hex, points: irisPoints, group: classifyEye(eyes.lab) },
    undertone: reading.undertone,
    reading,
    faceBox,
    jaw: JAW.map((i) => lm[i]),
    lightCorrected: bShift !== 0,
  };
}

// Photos render irises dark and muted, so map the measured colour to a named
// eye colour group instead of using it raw.
function classifyEye(lab: Lab): EyeGroup {
  const [L, C, H] = toLch(lab);
  const byId = (id: EyeGroup["id"]) => EYE_GROUPS.find((g) => g.id === id)!;
  if (C < 5) return byId(L > 45 ? "gray" : "darkBrown");
  if (H >= 180 && H < 300) return byId(C >= 8 ? "blue" : "grayBlue");
  if (H >= 100 && H < 180) return byId(C >= 8 ? "green" : "grayGreen");
  if (H >= 72 && H < 100) return byId("hazel");
  if (L < 32) return byId("darkBrown");
  return byId(L < 45 ? "brown" : "amber");
}
