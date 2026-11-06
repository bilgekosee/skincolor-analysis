import type { Undertone } from "./color";

// Data ported from deneme_sayfasi.html. Season palettes are sample colours
// and still need to be checked against a real colour analysis source.

export type MetalId = "gold" | "silver" | "rose";

export const METALS: Record<MetalId, { label: string; hex: string }> = {
  gold: { label: "Altın", hex: "#e8c06a" },
  silver: { label: "Gümüş", hex: "#d9dce1" },
  rose: { label: "Rose gold", hex: "#e6a98f" },
};

// Monk Skin Tone scale (Google, Dr. Ellis Monk), 1 lightest to 10 deepest.
export const MONK = [
  "#f6ede4",
  "#f3e7db",
  "#f7ead0",
  "#eadaba",
  "#d7bd96",
  "#a07e56",
  "#825c43",
  "#604134",
  "#3a312a",
  "#292420",
];

export const NAT_HAIR: Record<string, string> = {
  Siyah: "#16110e",
  "Koyu kahve": "#3b2a1e",
  Kahve: "#5c4030",
  "Açık kahve": "#8a6a4a",
  "Koyu sarı": "#b08d5a",
  Sarı: "#d9b980",
  Kızıl: "#a5502a",
  Gri: "#9a9a9a",
};

export type SeasonKey = "LS" | "WS" | "WA" | "DA" | "SA" | "LSu" | "CS" | "SS" | "CW" | "DW";

export type Season = {
  name: string;
  en: string;
  metal: MetalId;
  clothes: string[];
  avoid: string[];
  lips: string[];
  blush: string[];
  shadow: string[];
  hair: string[];
};

// Each season: 16 clothing colours (4 neutrals, then lights, mids and accents),
// colours to avoid, and makeup/hair suggestions. Sample palettes, not yet
// checked against a published colour analysis system.
export const SEASONS: Record<SeasonKey, Season> = {
  LS: {
    name: "Açık İlkbahar",
    en: "Light Spring",
    metal: "gold",
    clothes: [
      "#FFF6E5", "#E8D8BF", "#D9BC94", "#6F7FA8",
      "#F9C9A8", "#F8E3A3", "#BFE3C8", "#A6DCD9",
      "#F4978E", "#6CC3C1", "#A3B4E8", "#A8D17A",
      "#F28CA4", "#33B5B0", "#F2C75C", "#F39C7A",
    ],
    avoid: ["#111111", "#6E1E33", "#3A3A3A", "#4E2A4F", "#5A5A2A"],
    lips: ["#F2937F", "#E98A7C", "#F0A3A0", "#D97B6C", "#E8806E"],
    blush: ["#F5A992", "#F3B49A", "#EFA0A0", "#F7B7A3"],
    shadow: ["#D9B48F", "#C2D6B1", "#E6CBA5", "#A9CBD4", "#9C7E62"],
    hair: ["#E6C78B", "#D4AC73", "#C29462", "#E0B27C", "#B98A57"],
  },
  WS: {
    name: "Sıcak İlkbahar",
    en: "Warm Spring",
    metal: "gold",
    clothes: [
      "#FAF0D7", "#E3CBA3", "#C8A06B", "#8A5A2B",
      "#F8B58C", "#F6C343", "#8CC63F", "#5CC8C4",
      "#F26B4F", "#F7A541", "#3AA655", "#18A99C",
      "#E2452F", "#0F8B8D", "#6F86D6", "#F07A8A",
    ],
    avoid: ["#111111", "#A9AFB8", "#B0186E", "#D6E8F5", "#1B2440"],
    lips: ["#F2684A", "#E2583A", "#F07E64", "#D45A3C", "#F08A6C"],
    blush: ["#F58A6B", "#F3A06E", "#F48C7D", "#F7A383"],
    shadow: ["#C9963A", "#8A6A45", "#3E9E62", "#C98A4E", "#B07C2E"],
    hair: ["#C68642", "#B5651D", "#D2955B", "#A0522D", "#E0B062"],
  },
  WA: {
    name: "Sıcak Sonbahar",
    en: "Warm Autumn",
    metal: "gold",
    clothes: [
      "#F1E4C8", "#B48A5A", "#6B5B3A", "#5B3A22",
      "#E08B62", "#D4A240", "#C9962E", "#75773A",
      "#B5532A", "#C46A45", "#D9772B", "#5F7046",
      "#B83A2B", "#9C3F2C", "#2F5A3F", "#2C6E6A",
    ],
    avoid: ["#E7489A", "#CFE6F5", "#111111", "#C9C3E6", "#BFC4CC"],
    lips: ["#B5502B", "#A3502F", "#C1553A", "#8B3A1A", "#C76A4C"],
    blush: ["#CD6F4F", "#C67B5C", "#B86A48", "#D58A68"],
    shadow: ["#8B5A2B", "#6B7A35", "#B8862F", "#A0522D", "#5C4033"],
    hair: ["#8B4513", "#A0522D", "#6F3B1F", "#B5651D", "#4A2A14"],
  },
  DA: {
    name: "Koyu Sonbahar",
    en: "Deep Autumn",
    metal: "gold",
    clothes: [
      "#EEE2C8", "#3E3A36", "#4A2E1F", "#3B2A20",
      "#B8892A", "#A67C1B", "#B5541F", "#4B5320",
      "#8C3A1C", "#A83324", "#6E2A23", "#4E5A2A",
      "#7A1F22", "#234A33", "#1F4F55", "#4F2A3A",
    ],
    avoid: ["#F6C9D6", "#BFD7EA", "#D9D2EE", "#C0C0C0", "#F4F8FB"],
    lips: ["#8B2E1F", "#7B1F1F", "#A0402A", "#6B2A1F", "#934A3A"],
    blush: ["#A0522D", "#8B4A3A", "#B5634B", "#9E5A45"],
    shadow: ["#4B3621", "#556B2F", "#8B4513", "#704214", "#2F4F4F"],
    hair: ["#3B2219", "#4A2A14", "#5C3317", "#2B1B12", "#6F3B1F"],
  },
  SA: {
    name: "Yumuşak Sonbahar",
    en: "Soft Autumn",
    metal: "rose",
    clothes: [
      "#D9C8AE", "#A8998A", "#8C7B6B", "#9B958C",
      "#D59A80", "#C9A866", "#9AA585", "#7FA392",
      "#B9785C", "#B88B5A", "#77805A", "#5E8A86",
      "#A9746E", "#8E6A6F", "#7C7A55", "#6B7B5E",
    ],
    avoid: ["#111111", "#C2187E", "#9FE3F2", "#FFFFFF", "#1F47B8"],
    lips: ["#B5776B", "#A86A5C", "#C08070", "#9C6B5E", "#B97A6A"],
    blush: ["#C9907E", "#B98273", "#D4A28C", "#C3907A"],
    shadow: ["#8F7A66", "#9A8F6E", "#7D6C5C", "#A88B6E", "#6E6455"],
    hair: ["#7B5B3A", "#8C6A48", "#6B4F36", "#9C7A54", "#5A4330"],
  },
  LSu: {
    name: "Açık Yaz",
    en: "Light Summer",
    metal: "silver",
    clothes: [
      "#F4F2EE", "#C9CCD1", "#B9AFA8", "#5D6E8E",
      "#B8CCE4", "#CFC6E6", "#F2C6CF", "#BFE2D6",
      "#98A8D8", "#E3A0B3", "#8FB6DC", "#A9DDE0",
      "#C8A2C8", "#E58FA0", "#7FB8B5", "#A9A3BF",
    ],
    avoid: ["#F28C28", "#111111", "#A0461F", "#C99A2E", "#4A2E1F"],
    lips: ["#E8A0B0", "#D98695", "#F2A5B5", "#C97C8C", "#E3909F"],
    blush: ["#F2B5C4", "#E8A0B4", "#F4C2C2", "#EBAABB"],
    shadow: ["#B0A8C8", "#A8B8C8", "#C8A8B8", "#9AA5B5", "#D8C8D8"],
    hair: ["#D8C9A8", "#C2B28F", "#A89A7A", "#E5D8B9", "#9C8B6E"],
  },
  CS: {
    name: "Serin Yaz",
    en: "Cool Summer",
    metal: "silver",
    clothes: [
      "#EFF0F2", "#8A97A8", "#8E8487", "#3E4C6B",
      "#C3B1E1", "#D8BFD8", "#9FB4D6", "#A7C7C4",
      "#6A7FA8", "#9F8FC9", "#C9798F", "#4F8E91",
      "#B5527A", "#7B4B6E", "#93466B", "#3F6A6A",
    ],
    avoid: ["#F28C28", "#DAA520", "#808000", "#111111", "#C19A6B"],
    lips: ["#B5527A", "#A64D79", "#C06C84", "#9E4770", "#D0738F"],
    blush: ["#D58BA4", "#C77D98", "#E0A0B4", "#CF8DA2"],
    shadow: ["#7A6A8F", "#6A7FA8", "#8E7C9A", "#5C6B7A", "#A890B8"],
    hair: ["#8B7D6B", "#6E6150", "#9C8E7A", "#5A4E40", "#B0A28A"],
  },
  SS: {
    name: "Yumuşak Yaz",
    en: "Soft Summer",
    metal: "silver",
    clothes: [
      "#ECE9E4", "#C9B8B0", "#A39C97", "#5A5C63",
      "#9DB8B0", "#A3A3C2", "#C4A7AE", "#B3BFCB",
      "#8796AA", "#8FA69A", "#B88A93", "#6E8F90",
      "#A07C8C", "#7A5C6E", "#6B7F99", "#4D5A70",
    ],
    avoid: ["#FF4500", "#111111", "#FFD700", "#7FD13B", "#FFFFFF"],
    lips: ["#B07A85", "#A3707B", "#C08A94", "#966873", "#B88590"],
    blush: ["#C9969F", "#BB8A93", "#D3A5AC", "#C49099"],
    shadow: ["#8C8A9A", "#9A8F96", "#7D8B8A", "#A898A0", "#6E7480"],
    hair: ["#9C8B76", "#8A7A66", "#7A6B58", "#B0A08A", "#6A5C4C"],
  },
  CW: {
    name: "Serin Kış",
    en: "Cool Winter",
    metal: "silver",
    clothes: [
      "#FFFFFF", "#D6DCE4", "#36393F", "#1C2541",
      "#F3D3E4", "#D3E9F5", "#C9C3EA", "#CDEDE6",
      "#1F47B8", "#0047AB", "#00875A", "#008B8B",
      "#C8102E", "#C2187E", "#5B2A86", "#01665E",
    ],
    avoid: ["#E07B39", "#DAA520", "#808000", "#C19A6B", "#A0461F"],
    lips: ["#C2185B", "#B0003A", "#D81B60", "#9C2A7A", "#E0457B"],
    blush: ["#E05080", "#D0407A", "#F06292", "#DA6A94"],
    shadow: ["#4169E1", "#6A5ACD", "#708090", "#4B0082", "#2F4F4F"],
    hair: ["#1A1110", "#2B1B17", "#3B3B3B", "#4A3B35", "#0F0F0F"],
  },
  DW: {
    name: "Koyu Kış",
    en: "Deep Winter",
    metal: "silver",
    clothes: [
      "#F7F7F5", "#111111", "#2E2E33", "#14213D",
      "#F1F3B3", "#D7E3F4", "#E9C6D9", "#B7D9CF",
      "#B0122B", "#0F3A82", "#00563F", "#00616B",
      "#6A0D2B", "#4B1E78", "#A1145F", "#1F4D3A",
    ],
    avoid: ["#FFDAB9", "#C2A383", "#DAA520", "#F5DEB3", "#C46A45"],
    lips: ["#8B0000", "#800020", "#B0003A", "#6A0D2B", "#C2185B"],
    blush: ["#B0305A", "#A0284A", "#C04060", "#B8506E"],
    shadow: ["#2F2F4F", "#4B0082", "#3B3B3B", "#5A2A4A", "#1F3A5F"],
    hair: ["#1A1110", "#2B1B17", "#0F0F0F", "#3B2A25", "#4A0E0E"],
  },
};

export type EyeGroup = {
  id: "darkBrown" | "brown" | "amber" | "hazel" | "green" | "grayGreen" | "blue" | "grayBlue" | "gray";
  name: string;
  hex: string;
};

export const EYE_GROUPS: EyeGroup[] = [
  { id: "darkBrown", name: "Koyu kahve", hex: "#3b2414" },
  { id: "brown", name: "Kahve", hex: "#5a3a22" },
  { id: "amber", name: "Bal", hex: "#8a6236" },
  { id: "hazel", name: "Ela", hex: "#7a6a3a" },
  { id: "green", name: "Yeşil", hex: "#5f7a4a" },
  { id: "grayGreen", name: "Gri yeşil", hex: "#6f7d6e" },
  { id: "blue", name: "Mavi", hex: "#4a6a8f" },
  { id: "grayBlue", name: "Gri mavi", hex: "#6f8090" },
  { id: "gray", name: "Gri", hex: "#7f8a96" },
];

export const EYES = ["#5a3a22", "#3b2414", "#7a5a2e", "#5f6a3a", "#3f6b6e", "#4a6a8f", "#7f8a96", "#2a1a10"];
export const LINERS = ["#141010", "#3a2618", "#1f2a44", "#2e3a24", "#4a2a3a"];
export const BROWS = ["#2a1a12", "#3b2a1e", "#5c4030", "#8a6a4a", "#b08d5a", "#16110e"];
export const CONTOUR = ["#b08b74", "#9a7660", "#8a6a58", "#c8a48c"];

type QuizAnswer = "warm" | "cool" | "neutral" | "olive" | "none";

export const QUIZ: { q: string; a: [label: string, value: QuizAnswer][] }[] = [
  {
    q: "Bileğindeki damarlar ne renk görünüyor?",
    a: [
      ["Mavi ya da mor", "cool"],
      ["Yeşil", "warm"],
      ["İkisi karışık", "neutral"],
    ],
  },
  {
    q: "Hangi takı seni daha canlı gösteriyor?",
    a: [
      ["Gümüş", "cool"],
      ["Altın", "warm"],
      ["Fark etmiyor", "neutral"],
    ],
  },
  {
    q: "Güneşte ne oluyor?",
    a: [
      ["Kolay yanıyorum", "cool"],
      ["Kolay bronzlaşıyorum", "warm"],
      ["Önce yanıp sonra bronzlaşıyorum", "neutral"],
    ],
  },
  {
    q: "Tenin gün ışığında hafif yeşilimsi ya da grimsi görünüyor mu?",
    a: [
      ["Evet", "olive"],
      ["Hayır", "none"],
    ],
  },
];

export type QuizState = (QuizAnswer | null)[];

export function scoreQuiz(answers: QuizState): Undertone | null {
  const first = answers.slice(0, 3);
  if (!first.some(Boolean)) return null;
  const score = { warm: 0, cool: 0, neutral: 0 };
  first.forEach((v) => {
    if (v === "warm" || v === "cool" || v === "neutral") score[v]++;
  });
  let ut: Undertone;
  if (score.cool > score.warm) ut = score.neutral > 0 || score.warm > 0 ? "neutralCool" : "cool";
  else if (score.warm > score.cool) ut = score.neutral > 0 || score.cool > 0 ? "neutralWarm" : "warm";
  else ut = "neutral";
  if (answers[3] === "olive" && score.cool <= score.warm) ut = "olive";
  return ut;
}
