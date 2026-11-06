import type { Undertone } from "./color";
import type { QuizState } from "./palettes";

// Combines undertone evidence into one answer with a confidence level. Each
// source votes on a cool(+1) … warm(−1) scale:
//
// - drape test: the user's own judgement of their face next to paired
//   colours, as colour analysts do with fabric. Highest weight.
// - quiz: self-reported cues (veins, metal, sun). Medium weight.
//
// The photo does not vote. On 396 expert-labelled Deep Armocromia photos the
// measured skin hue angle had the same distribution for every season (median
// 48–49°) and separated warm from cool no better than chance (49%, leave-one-
// out). It is still shown for information, and the photo's skin, hair and
// contrast measurements still feed the season (those reached 41% on 4
// seasons vs 25% chance).

export type DrapeChoice = "a" | "b" | "same";

export type DrapeOption = { name: string; background: string; stops?: string[] };

export type DrapePair = {
  id: string;
  question: string;
  // What to look at in the face for this particular pair.
  hint: string;
  kind: "temperature" | "contrast";
  // `a` is always the cool / high-contrast option. `stops` makes the drape a
  // metallic gradient; `background` is the CSS for swatches.
  a: DrapeOption;
  b: DrapeOption;
};

export const DRAPE_PAIRS: DrapePair[] = [
  {
    id: "white",
    question: "Hangi beyazda yüzün daha aydınlık?",
    hint: "Saf beyazda yüzün yorgun ya da solgun görünüyorsa kırık beyaz senin. Kırık beyazda ten sarı, gri ya da kirli görünüyorsa saf beyaz senin.",
    kind: "temperature",
    a: { name: "Saf beyaz", background: "#ffffff" },
    b: { name: "Kırık beyaz", background: "#f3e8d2" },
  },
  {
    id: "metal",
    question: "Hangi metal teni daha canlı gösteriyor?",
    hint: "Hangisinde ten daha pürüzsüz ve canlı? Yanlış metal yüzde gölge yapar, ten griye ya da sarıya kayar.",
    kind: "temperature",
    a: {
      name: "Gümüş",
      background: "linear-gradient(135deg,#f4f5f6 0%,#a3a9ae 45%,#e7e9eb 70%,#9aa0a6 100%)",
      stops: ["#f4f5f6", "#a3a9ae", "#e7e9eb", "#9aa0a6"],
    },
    b: {
      name: "Altın",
      background: "linear-gradient(135deg,#fff1bd 0%,#c9992f 45%,#f6dc8c 70%,#b8862a 100%)",
      stops: ["#fff1bd", "#c9992f", "#f6dc8c", "#b8862a"],
    },
  },
  {
    id: "pink",
    question: "Hangisinde yanakların daha sağlıklı duruyor?",
    hint: "Burun kenarı ve yanaklardaki kızarıklığa bak. Doğru pembe kızarıklığı azaltır, yanlışı onu öne çıkarır ya da teni sarartır.",
    kind: "temperature",
    a: { name: "Soğuk pembe", background: "#d9578b" },
    b: { name: "Şeftali", background: "#f2a27c" },
  },
  {
    id: "blue",
    question: "Hangisinde göz altların daha az belirgin?",
    hint: "Göz altlarına ve ağız kenarındaki gölgelere bak. Doğru renkte gölgeler hafifler, yanlış renkte koyulaşır.",
    kind: "temperature",
    a: { name: "Kraliyet mavisi", background: "#2a4fb8" },
    b: { name: "Kiremit", background: "#b9572e" },
  },
  {
    id: "dark",
    question: "Hangi koyu renk seni yutmuyor, taşıyor?",
    hint: "Hangisinde önce yüzünü görüyorsun? Yanlış koyu renkte önce kumaş göze çarpar, yüz geride kalır ve sertleşir.",
    kind: "contrast",
    a: { name: "Siyah", background: "#111111" },
    b: { name: "Çikolata kahve", background: "#4a2c1d" },
  },
  {
    id: "clarity",
    question: "Canlı mı yumuşak mı yüzüne daha çok yakışıyor?",
    hint: "Canlı renkte yüzün daha canlı ve net mi, yoksa renk seni bastırıyor mu? Yumuşak renkte yüzün sakin mi, yoksa donuk ve soluk mu?",
    kind: "contrast",
    a: { name: "Canlı zümrüt", background: "#00875a" },
    b: { name: "Adaçayı", background: "#8fa585" },
  },
];

export type DrapeAnswers = Partial<Record<string, DrapeChoice>>;

const WEIGHT = { drape: 1, quiz: 0.75 };

export type SourceSummary = {
  label: string;
  // Mean vote on the cool(+1) … warm(−1) scale, null when the source is empty.
  lean: number | null;
  detail: string;
};

export type UndertoneVerdict = {
  undertone: Undertone;
  confidence: "high" | "medium" | "low";
  conflict: boolean;
  sources: SourceSummary[];
  // Drape answers on contrast: true = high contrast / bright, null = no signal.
  highContrast: boolean | null;
};

function leanLabel(lean: number | null) {
  if (lean === null) return "—";
  if (lean > 0.6) return "soğuk";
  if (lean > 0.2) return "nötr-soğuk";
  if (lean >= -0.2) return "nötr";
  if (lean >= -0.6) return "nötr-sıcak";
  return "sıcak";
}

export function combineEvidence({
  photo,
  quiz,
  drape,
}: {
  photo: { hue: number } | null;
  quiz: QuizState;
  drape: DrapeAnswers;
}): UndertoneVerdict | null {
  const drapeVotes = DRAPE_PAIRS.filter((p) => p.kind === "temperature" && drape[p.id]).map((p) =>
    drape[p.id] === "a" ? 1 : drape[p.id] === "b" ? -1 : 0,
  );
  const quizVotes = quiz
    .slice(0, 3)
    .filter((v): v is "warm" | "cool" | "neutral" => v === "warm" || v === "cool" || v === "neutral")
    .map((v) => (v === "cool" ? 1 : v === "warm" ? -1 : 0));

  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  const sources: SourceSummary[] = [
    {
      label: "Renk kartları",
      lean: mean(drapeVotes),
      detail: drapeVotes.length ? `${drapeVotes.length}/4 çift` : "yapılmadı",
    },
    { label: "Sorular", lean: mean(quizVotes), detail: quizVotes.length ? `${quizVotes.length}/3 soru` : "cevaplanmadı" },
    {
      label: "Fotoğraf",
      lean: null,
      detail: photo ? `ton açısı ${photo.hue.toFixed(0)}° · alt tonu güvenilir göstermiyor, oy vermiyor` : "yok",
    },
  ];

  const parts = [
    { votes: drapeVotes, w: WEIGHT.drape },
    { votes: quizVotes, w: WEIGHT.quiz },
  ];
  let sum = 0;
  let weight = 0;
  for (const { votes, w } of parts) {
    for (const v of votes) {
      sum += v * w;
      weight += w;
    }
  }
  if (weight === 0) return null;
  const lean = sum / weight;

  let undertone: Undertone =
    lean > 0.6 ? "cool" : lean > 0.2 ? "neutralCool" : lean >= -0.2 ? "neutral" : lean >= -0.6 ? "neutralWarm" : "warm";
  if (quiz[3] === "olive" && lean <= 0.2) undertone = "olive";

  const signs = sources.map((s) => s.lean).filter((l): l is number => l !== null && Math.abs(l) > 0.25).map(Math.sign);
  const conflict = signs.includes(1) && signs.includes(-1);
  const drapeDone = drapeVotes.length >= 3;
  const confidence = drapeDone && !conflict ? "high" : drapeDone || (!conflict && sources.filter((s) => s.lean !== null).length >= 2) ? "medium" : "low";

  const contrastVotes = DRAPE_PAIRS.filter((p) => p.kind === "contrast" && drape[p.id] && drape[p.id] !== "same").map(
    (p) => (drape[p.id] === "a" ? 1 : -1),
  );
  const contrastSum = contrastVotes.reduce((s, v) => s + v, 0);
  const highContrast = contrastSum > 0 ? true : contrastSum < 0 ? false : null;

  for (const s of sources) if (s.label !== "Fotoğraf") s.detail = `${leanLabel(s.lean)} · ${s.detail}`;
  return { undertone, confidence, conflict, sources, highContrast };
}
