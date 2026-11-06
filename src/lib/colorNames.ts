import { hexToLab } from "./color";

// Turkish names for palette colours. Each palette hex is labelled with the
// nearest entry (CIELAB distance), so palettes can change without hand-naming
// every swatch. Names describe the colour family, not an exact match.
const NAMES: [name: string, hex: string][] = [
  ["Saf beyaz", "#ffffff"],
  ["Kırık beyaz", "#f4f1ea"],
  ["Fildişi", "#fff8e7"],
  ["Krem", "#f3e8d2"],
  ["Ekru", "#e8dcc2"],
  ["Bej", "#d9c8ae"],
  ["Deve tüyü", "#c19a6b"],
  ["Karamel", "#b07a3f"],
  ["Taupe", "#8c7b6b"],
  ["Mantar grisi", "#a39c97"],
  ["Gri", "#9a9a9a"],
  ["Gümüş grisi", "#c9ccd1"],
  ["Mavi gri", "#8a97a8"],
  ["Arduvaz", "#5f6b7a"],
  ["Kömür grisi", "#36393f"],
  ["Siyah", "#111111"],
  ["Lacivert", "#1c2541"],
  ["Gece mavisi", "#14213d"],
  ["Kraliyet mavisi", "#1f47b8"],
  ["Kobalt", "#0047ab"],
  ["Mısır mavisi", "#3e8ede"],
  ["Gök mavisi", "#8fb6dc"],
  ["Toz mavi", "#b8cce4"],
  ["Buz mavisi", "#d3e9f5"],
  ["Periwinkle", "#98a8d8"],
  ["Denim", "#6a7fa8"],
  ["Petrol", "#1f5f63"],
  ["Teal", "#008b8b"],
  ["Turkuaz", "#1cb5ac"],
  ["Su yeşili", "#a9dde0"],
  ["Nane", "#bfe3c8"],
  ["Deniz köpüğü", "#9ecfcb"],
  ["Adaçayı", "#8fa585"],
  ["Yosun yeşili", "#77805a"],
  ["Zeytin yeşili", "#6b6b2a"],
  ["Haki", "#7f7a4f"],
  ["Orman yeşili", "#2f4f3a"],
  ["Zümrüt", "#00875a"],
  ["Kelly yeşili", "#3aa655"],
  ["Elma yeşili", "#8cc63f"],
  ["Limon sarısı", "#f2f5a6"],
  ["Tereyağı sarısı", "#f8e3a3"],
  ["Altın sarısı", "#f4b400"],
  ["Hardal", "#c99a2e"],
  ["Bal", "#d29c47"],
  ["Şeftali", "#f9c9a8"],
  ["Kayısı", "#f8b58c"],
  ["Mercan", "#ff6f59"],
  ["Somon", "#f39c7a"],
  ["Bal kabağı", "#d9772b"],
  ["Kiremit", "#b5532a"],
  ["Pas", "#a0461f"],
  ["Tarçın", "#9a3b2a"],
  ["Terrakota", "#c46a45"],
  ["Domates kırmızısı", "#e2452f"],
  ["Klasik kırmızı", "#c8102e"],
  ["Vişne", "#8b0000"],
  ["Bordo", "#6a0d2b"],
  ["Şarap", "#7b2d26"],
  ["Gül kurusu", "#b5767e"],
  ["Rose brown", "#a9746e"],
  ["Pudra pembe", "#e8b9c6"],
  ["Buz pembesi", "#f3d3e4"],
  ["Toz pembe", "#f2c6cf"],
  ["Karpuz pembesi", "#e58fa0"],
  ["Ahududu", "#b5527a"],
  ["Fuşya", "#c2187e"],
  ["Mürdüm", "#7b4b6e"],
  ["Erik", "#7a5c6e"],
  ["Patlıcan moru", "#4f2a3a"],
  ["Kraliyet moru", "#5b2a86"],
  ["Lavanta", "#b9a6d3"],
  ["Leylak", "#c8a2c8"],
  ["Mor gri", "#a3a3c2"],
  ["Çikolata", "#5a3825"],
  ["Kestane", "#6f3b1f"],
  ["Espresso", "#3b2a20"],
  ["Koyu kahve", "#3b2219"],
  ["Kahve", "#6e4a2f"],
  ["Açık kahve", "#8a6a4a"],
  ["Küllü kahve", "#8b7d6b"],
  ["Koyu küllü sarı", "#a89a7a"],
  ["Küllü sarı", "#d8c9a8"],
  ["Bal köpüğü", "#c9a16a"],
  ["Altın sarı", "#e6c78b"],
  ["Bakır", "#b5651d"],
  ["Kızıl kahve", "#a0522d"],
  ["Mavi siyah", "#0f0f14"],
  ["Soğuk siyah kahve", "#2b1b17"],
  ["Koyu gri", "#3b3b3b"],
  // Makeup tones, so lip/blush/shadow rows don't collapse into one name.
  ["Tarçın nude", "#b5776b"],
  ["Kakao", "#9c6b5e"],
  ["Terrakota nude", "#c08070"],
  ["Toz gül", "#c9907e"],
  ["Şeftali gül", "#d4a28c"],
  ["Mauve", "#b07a85"],
  ["Berry", "#9e4770"],
  ["Orkide", "#c06c84"],
  ["Soğuk gül", "#d58ba4"],
  ["Gül", "#c2708a"],
  ["Mercan nude", "#e98a7c"],
  ["Pembe nude", "#f0a3a0"],
  ["Tuğla", "#a0402a"],
  ["Koyu tarçın", "#8b2e1f"],
  ["Bronz bakır", "#c98a4e"],
  ["Bronz", "#8b5a2b"],
  ["Sıcak bej", "#e3cba3"],
  ["Mor kahve", "#5c4033"],
  ["Lavanta gri", "#b0a8c8"],
  ["Gül bej", "#c9b8b0"],
  ["Sisli mavi", "#a8b8c8"],
  ["Gri yeşil", "#7d8b8a"],
  ["Mürdüm gri", "#8e7c9a"],
];

const TABLE = NAMES.map(([name, hex]) => ({ name, lab: hexToLab(hex) }));

// Lightness gap (CIELAB L) beyond which a name gets an "Açık" / "Koyu" prefix.
const SHADE_STEP = 7;
const lower = (name: string) => name.charAt(0).toLocaleLowerCase("tr") + name.slice(1);

// Nearest names first, each with an "Açık"/"Koyu" prefix when the colour is
// clearly lighter or darker than the named reference.
function candidates(hex: string, count = 4) {
  const [L, a, b] = hexToLab(hex);
  return TABLE.map((entry) => ({
    entry,
    d: (entry.lab[0] - L) ** 2 + (entry.lab[1] - a) ** 2 + (entry.lab[2] - b) ** 2,
  }))
    .sort((p, q) => p.d - q.d)
    .slice(0, count)
    .map(({ entry }) => {
      const dL = L - entry.lab[0];
      const shaded = /^(Açık|Koyu) /.test(entry.name);
      return shaded || Math.abs(dL) <= SHADE_STEP ? entry.name : `${dL > 0 ? "Açık" : "Koyu"} ${lower(entry.name)}`;
    });
}

export const colorName = (hex: string) => candidates(hex, 1)[0];

// Names for a row of swatches: a colour whose nearest name is taken gets its
// next-nearest one, so every swatch in the row reads differently.
export function colorNames(hexes: string[]) {
  const used = new Set<string>();
  return hexes.map((hex) => {
    const options = candidates(hex);
    const name = options.find((n) => !used.has(n)) ?? `${options[0]} ${used.size + 1}`;
    used.add(name);
    return name;
  });
}
