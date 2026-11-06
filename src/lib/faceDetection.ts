import type { FaceLandmarker, ImageSegmenter } from "@mediapipe/tasks-vision";
import { analyzeFace, type AnalysisResult } from "./colorAnalysis";

// Browser-only helpers shared by the photo analyzer and the calibration page.

const WASM_PATH = "/mediapipe";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const MAX_SIDE = 1024;

const SEGMENTER_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;
let segmenterPromise: Promise<ImageSegmenter> | null = null;

// MediaPipe reports routine status ("INFO: Created TensorFlow Lite XNNPACK
// delegate…") through console.error, some of it asynchronously after a call
// returns, and the Next.js dev overlay shows it as an error. Filter just those
// lines, once, for the lifetime of the page.
let consoleFiltered = false;
function quietMediaPipe() {
  if (consoleFiltered) return;
  consoleFiltered = true;
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("INFO:")) return;
    original(...args);
  };
}

export function getLandmarker() {
  landmarkerPromise ??= (async () => {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
    quietMediaPipe();
    return FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "IMAGE",
      numFaces: 1,
    });
  })().catch((error) => {
    landmarkerPromise = null;
    throw error;
  });
  return landmarkerPromise;
}

// Person parsing: background, hair, body skin, face skin, clothes, accessories.
function getSegmenter() {
  segmenterPromise ??= (async () => {
    const { ImageSegmenter, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
    quietMediaPipe();
    return ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: SEGMENTER_URL, delegate: "GPU" },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });
  })().catch((error) => {
    segmenterPromise = null;
    throw error;
  });
  return segmenterPromise;
}

const CLASS = { background: 0, hair: 1, clothes: 4 };

type Segmentation = { width: number; height: number; data: Uint8Array };

async function segment(canvas: HTMLCanvasElement): Promise<Segmentation | null> {
  try {
    const segmenter = await getSegmenter();
    const result = segmenter.segment(canvas);
    const mask = result.categoryMask;
    if (!mask) return null;
    const out = { width: mask.width, height: mask.height, data: mask.getAsUint8Array().slice() };
    result.close();
    return out;
  } catch {
    // Without segmentation the drape still works, just over the original background.
    return null;
  }
}

// White-on-transparent canvas of the pixels whose class passes `test`, feathered.
function maskOf(seg: Segmentation, test: (c: number) => boolean, feather = 1.5) {
  const raw = document.createElement("canvas");
  raw.width = seg.width;
  raw.height = seg.height;
  const rctx = raw.getContext("2d")!;
  const img = rctx.createImageData(seg.width, seg.height);
  for (let i = 0; i < seg.data.length; i++) {
    if (!test(seg.data[i])) continue;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = img.data[i * 4 + 3] = 255;
  }
  rctx.putImageData(img, 0, 0);
  const soft = document.createElement("canvas");
  soft.width = seg.width;
  soft.height = seg.height;
  const sctx = soft.getContext("2d")!;
  sctx.filter = `blur(${feather}px)`;
  sctx.drawImage(raw, 0, 0);
  return soft;
}

// The photo cut out by a mask, full size.
function cutOut(canvas: HTMLCanvasElement, mask: HTMLCanvasElement) {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
  return out;
}

export function drawToCanvas(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  width: number,
  height: number,
  mirror = false,
) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.save();
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  return ctx;
}

// Returns null when no face is found. Throws if the model can't load.
export async function analyzeCanvas(canvas: HTMLCanvasElement): Promise<AnalysisResult | null> {
  const landmarker = await getLandmarker();
  const face = landmarker.detect(canvas).faceLandmarks[0];
  if (!face) return null;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  return analyzeFace(ctx.getImageData(0, 0, canvas.width, canvas.height), face);
}

export function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not open ${file.name}`));
    };
    image.src = url;
  });
}

export function drawMarkers(ctx: CanvasRenderingContext2D, result: AnalysisResult) {
  const r = Math.max(4, ctx.canvas.width / 90);
  ctx.lineWidth = Math.max(1.5, r / 3);
  for (const group of [result.skin, result.hair, result.eyes]) {
    for (const p of group.points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = group.hex;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.stroke();
    }
  }
}

export type DrapeImage = {
  // Portrait with the background replaced by neutral grey when segmentation worked.
  src: string;
  // Hair only (PNG with alpha), drawn over the drape so it falls on the fabric.
  hair: string | null;
  // The user's own clothes as a white-on-black PNG, used as a mask to recolour them.
  clothes: string | null;
  width: number;
  height: number;
  // SVG path of a cape covering neck and shoulders, starting just under the jaw.
  cape: string;
  // viewBox that zooms on the lower face and the drape's edge.
  zoom: string;
};

const DRAPE_W = 480;
const DRAPE_H = 600;

// Portrait crop with neck and shoulders, plus a cape outline in crop pixels,
// so drape colours can be shown as something the user is wearing.
export async function buildDrape(canvas: HTMLCanvasElement, result: AnalysisResult): Promise<DrapeImage> {
  const box = result.faceBox;
  const cropW = box.w * 2.3;
  const cropH = cropW * (DRAPE_H / DRAPE_W);
  const left = box.x + box.w / 2 - cropW / 2;
  const top = box.y - box.h * 0.38;
  const s = DRAPE_W / cropW;

  const crop = (source: CanvasImageSource, background: string | null) => {
    const out = document.createElement("canvas");
    out.width = DRAPE_W;
    out.height = DRAPE_H;
    const ctx = out.getContext("2d")!;
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, DRAPE_W, DRAPE_H);
    }
    ctx.drawImage(source, left, top, cropW, cropH, 0, 0, DRAPE_W, DRAPE_H);
    return out;
  };

  // Neutral grey, as in colour analysis: a coloured room shifts how skin reads.
  const GREY = "#8a8a8c";
  const seg = await segment(canvas);
  let src: string;
  let hair: string | null = null;
  let clothes: string | null = null;
  if (seg) {
    const person = cutOut(canvas, maskOf(seg, (c) => c !== CLASS.background));
    src = crop(person, GREY).toDataURL("image/jpeg", 0.9);
    hair = crop(cutOut(canvas, maskOf(seg, (c) => c === CLASS.hair, 1)), null).toDataURL("image/png");
    clothes = crop(maskOf(seg, (c) => c === CLASS.clothes, 2), "#000").toDataURL("image/png");
  } else {
    src = crop(canvas, GREY).toDataURL("image/jpeg", 0.9);
  }

  const map = (p: { x: number; y: number }) => ({ x: (p.x - left) * s, y: (p.y - top) * s });
  const faceW = box.w * s;
  const faceH = box.h * s;
  const jaw = result.jaw.map(map);
  const chin = jaw.reduce((a, p) => (p.y > a.y ? p : a), jaw[0]);
  const f = (n: number) => n.toFixed(1);

  // A round neckline below the chin with the neck showing, sloping down to
  // the shoulders, like a top worn for draping. It deliberately does not hug
  // the jaw: that hides the neck and looks cut out.
  const neckY = Math.min(DRAPE_H - 40, chin.y + faceH * 0.17);
  const neckHalf = faceW * 0.33;
  const shoulderY = Math.min(DRAPE_H - 10, chin.y + faceH * 0.36);
  const cx = chin.x;
  const cape = [
    `M 0 ${f(shoulderY)}`,
    `C ${f(cx * 0.45)} ${f(shoulderY - faceH * 0.07)} ${f(cx - neckHalf * 1.5)} ${f(neckY + faceH * 0.01)} ${f(cx - neckHalf)} ${f(neckY)}`,
    `Q ${f(cx)} ${f(neckY + faceH * 0.11)} ${f(cx + neckHalf)} ${f(neckY)}`,
    `C ${f(cx + neckHalf * 1.5)} ${f(neckY + faceH * 0.01)} ${f(cx + (DRAPE_W - cx) * 0.55)} ${f(shoulderY - faceH * 0.07)} ${DRAPE_W} ${f(shoulderY)}`,
    `L ${DRAPE_W} ${DRAPE_H} L 0 ${DRAPE_H} Z`,
  ].join(" ");

  const zw = Math.min(DRAPE_W, box.w * s * 1.6);
  const zh = zw * (DRAPE_H / DRAPE_W);
  const zx = Math.max(0, Math.min(DRAPE_W - zw, chin.x - zw / 2));
  const zy = Math.max(0, Math.min(DRAPE_H - zh, neckY - zh * 0.62));

  return {
    src,
    hair,
    clothes,
    width: DRAPE_W,
    height: DRAPE_H,
    cape,
    zoom: `${f(zx)} ${f(zy)} ${f(zw)} ${f(zh)}`,
  };
}
