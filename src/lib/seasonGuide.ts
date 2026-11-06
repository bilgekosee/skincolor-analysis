import type { SeasonKey } from "./palettes";

// Written guidance per season, shown next to the palette swatches. General
// 12-season colour analysis advice; like the palettes, not yet checked against
// a published system.

export type SeasonGuide = {
  // One line on what defines the season.
  essence: string;
  clothes: { neutrals: string; colors: string; tip: string };
  avoid: string;
  hair: { best: string; avoid: string };
  makeup: { lips: string; blush: string; eyes: string };
  jewelry: string;
  combos: string[];
};

export const SEASON_GUIDES: Record<SeasonKey, SeasonGuide> = {
  LS: {
    essence: "Sıcak ama hafif: açık, berrak ve taze renkler. Ağır ve koyu tonlar yüzü bastırır.",
    clothes: {
      neutrals: "Fildişi, krem, açık deve tüyü ve sıcak açık gri. Siyah yerine açık lacivert ya da sıcak gri.",
      colors: "Şeftali, mercan pembesi, tereyağı sarısı, nane, su yeşili, periwinkle ve elma yeşili.",
      tip: "Yüzüne yakın parçalarda açık ve parlak renkleri seç; koyu renkleri pantolon ve ayakkabıda kullan.",
    },
    avoid: "Siyah, bordo, koyu mor ve koyu zeytin yüzünü yorgun gösterir; açık tenle aradaki fark fazla sert kalır.",
    hair: {
      best: "Altın sarı, bal köpüğü, açık bal ve çilek sarısı. Sıcak ışıltılı açık kahve de olur.",
      avoid: "Mavi siyah, soğuk küllü kahve ve platin; ten soluk ve gri görünebilir.",
    },
    makeup: {
      lips: "Şeftali, mercan nude ve sıcak pembe. Koyu bordo ve kahve rujlar ağır kaçar.",
      blush: "Şeftali ve açık mercan; yanakların üstüne hafifçe.",
      eyes: "Bej, açık bronz, yumuşak altın ve aqua. Siyah yerine kahve eyeliner.",
    },
    jewelry: "Sarı altın ve açık altın; ince ve parlak parçalar. Ağır antik metaller yüzü bastırır.",
    combos: ["Krem pantolon + şeftali bluz", "Açık lacivert ceket + tereyağı sarısı tişört", "Nane elbise + deve tüyü sandalet"],
  },
  WS: {
    essence: "Sıcak ve canlı: doygun, altın tabanlı renkler. Soluk ve küllü tonlar enerjini söndürür.",
    clothes: {
      neutrals: "Krem, deve tüyü, sıcak bej ve altın kahve. Lacivert yerine sıcak teal.",
      colors: "Mercan, domates kırmızısı, altın sarısı, mango, kelly yeşili, turkuaz ve sıcak pembe.",
      tip: "Canlı renkleri yüzünün yanında taşıyabilirsin; tek bir renk bloğu bile kombini taşır.",
    },
    avoid: "Siyah, gümüş gri, fuşya ve gece mavisi; soğuk ve ağır kalır, ten sarımsı ve soluk görünür.",
    hair: {
      best: "Altın kahve, bakır, bal, karamel ve sıcak kızıl. Işıltılı altın röfleler.",
      avoid: "Mavi siyah, küllü sarı ve gri tonlu kahveler.",
    },
    makeup: {
      lips: "Mercan, sıcak kırmızı ve şeftali. Mor ve soğuk pembe rujlardan kaçın.",
      blush: "Mercan ve sıcak şeftali.",
      eyes: "Altın, bronz, sıcak yeşil ve kahve. Kahve ya da zeytin eyeliner.",
    },
    jewelry: "Parlak sarı altın, bronz ve renkli taşlar (mercan, turkuaz).",
    combos: ["Krem gömlek + mercan pantolon", "Deve tüyü trençkot + turkuaz şal", "Kelly yeşili bluz + altın küpe"],
  },
  WA: {
    essence: "Sıcak ve toprak tonlu: baharat, orman ve altın. Buz gibi ve neon renkler yabancı kalır.",
    clothes: {
      neutrals: "Krem, deve tüyü, çikolata, sıcak haki ve zeytin kahvesi. Siyah yerine çikolata.",
      colors: "Kiremit, pas, bal kabağı, hardal, altın, zeytin, yosun yeşili, petrol ve domates kırmızısı.",
      tip: "Doku zengin parçalar (süet, kadife, örgü) bu paleti en iyi taşır.",
    },
    avoid: "Fuşya, buz mavisi, lavanta, siyah ve gümüş gri; ten grileşir, yüz donuk görünür.",
    hair: {
      best: "Bakır, kestane, sıcak çikolata, karamel ve kızıl kahve.",
      avoid: "Küllü kahve, platin, mavi siyah ve mor yansımalar.",
    },
    makeup: {
      lips: "Tarçın, terrakota, tuğla kırmızısı ve sıcak kahve nude.",
      blush: "Terrakota ve sıcak şeftali.",
      eyes: "Bakır, bronz, zeytin, haki ve altın. Kahve eyeliner.",
    },
    jewelry: "Sarı altın, antik altın, bronz ve bakır; kehribar ve kaplan gözü taşlar.",
    combos: ["Deve tüyü kazak + çikolata pantolon", "Zeytin ceket + krem gömlek + altın kolye", "Kiremit elbise + kahve deri çizme"],
  },
  DA: {
    essence: "Sıcak ve derin: koyu, zengin, ağır tonlar. Pastel ve buz renkleri yüzünü siler.",
    clothes: {
      neutrals: "Espresso, koyu çikolata, sıcak kömür grisi ve krem. Siyah yerine espresso ya da koyu zeytin.",
      colors: "Bordo kahve, vişne, pas, koyu hardal, koyu altın, orman yeşili, petrol ve patlıcan moru.",
      tip: "Koyu renkleri yüzünün yanında rahatça kullan; açık renk istiyorsan krem seç.",
    },
    avoid: "Bebek pembesi, toz mavi, lavanta, gümüş ve buz beyazı; yüz solgun ve yorgun görünür.",
    hair: {
      best: "Koyu çikolata, espresso, kestane ve bitter çikolata; hafif kızıl ya da bakır yansıma.",
      avoid: "Platin, küllü açık kahve ve soğuk mavi siyah.",
    },
    makeup: {
      lips: "Tuğla, tarçın, koyu kahve kırmızı ve şarap.",
      blush: "Terrakota ve koyu şeftali.",
      eyes: "Bronz, bakır, koyu zeytin, çikolata ve erik. Siyah kahve eyeliner.",
    },
    jewelry: "Antik altın, bronz ve bakır; büyük ve ağır parçalar taşınır.",
    combos: ["Espresso ceket + krem bluz", "Orman yeşili kazak + koyu kot + altın küpe", "Bordo kahve elbise + çikolata bot"],
  },
  SA: {
    essence: "Nötr-sıcak ve yumuşak: grileşmiş, sessiz, toprak tonları. Keskin kontrast ve neon renkler ağır gelir.",
    clothes: {
      neutrals: "Bej, mantar grisi, taupe, sıcak gri ve ekru. Siyah yerine taupe ya da sıcak kömür grisi.",
      colors: "Adaçayı, yosun yeşili, soft teal, somon, gül kurusu, rose brown, bal ve soft hardal.",
      tip: "Aynı renk ailesinden tonları üst üste kullan (ton sür ton); sert kontrastlardan kaçın.",
    },
    avoid: "Siyah, fuşya, neon turkuaz, saf beyaz ve kraliyet mavisi; renk seni değil sen rengi taşıyormuş gibi durur.",
    hair: {
      best: "Yumuşak çikolata, sütlü kahve, bal kahve, karamel röfle ve kül-altın arası kahve.",
      avoid: "Mavi siyah, platin ve çok parlak kızıl; çok keskin kalır.",
    },
    makeup: {
      lips: "Rose brown, gül kurusu, tarçın nude ve soft terrakota.",
      blush: "Toz gül ve soft şeftali.",
      eyes: "Taupe, bronz, zeytin, mat kahve. Kahve eyeliner, sert siyah çizgiden kaçın.",
    },
    jewelry: "Rose gold, mat altın ve antik pirinç; parlak gümüş yerine mat ve yumuşak metaller.",
    combos: ["Bej triko + adaçayı pantolon", "Gül kurusu bluz + taupe ceket + rose gold küpe", "Yosun yeşili elbise + karamel çanta"],
  },
  LSu: {
    essence: "Soğuk ve hafif: açık, serin, pudralı renkler. Koyu ve sıcak tonlar ağır kalır.",
    clothes: {
      neutrals: "Kırık beyaz, açık gri, gül bej ve soft lacivert. Siyah yerine arduvaz ya da soft lacivert.",
      colors: "Toz mavi, lavanta, toz pembe, nane, gök mavisi, periwinkle, karpuz pembesi ve leylak.",
      tip: "Açık tonları birbiriyle eşleştir; koyu renk istiyorsan soft lacivert kullan.",
    },
    avoid: "Turuncu, siyah, pas, hardal ve çikolata; yüz sararır ve kontrast sert kalır.",
    hair: {
      best: "Küllü sarı, bej sarı, açık küllü kahve ve soğuk açık kahve.",
      avoid: "Bakır, altın sarı, koyu siyah ve kızıl tonlar.",
    },
    makeup: {
      lips: "Toz pembe, gül, karpuz pembesi ve soft mauve.",
      blush: "Toz pembe ve soğuk gül.",
      eyes: "Lavanta, gri, soft mavi ve gül bej. Gri ya da soft kahve eyeliner.",
    },
    jewelry: "Gümüş, beyaz altın ve platin; inci çok yakışır.",
    combos: ["Kırık beyaz gömlek + toz mavi pantolon", "Lavanta kazak + açık gri etek", "Toz pembe elbise + gümüş küpe"],
  },
  CS: {
    essence: "Soğuk ve orta yoğunlukta: mavi tabanlı, hafif grileşmiş, zarif renkler.",
    clothes: {
      neutrals: "Kırık beyaz, mavi gri, arduvaz, soğuk taupe ve lacivert. Siyah yerine lacivert ya da arduvaz.",
      colors: "Denim, lavanta, ahududu, gül, soğuk teal, mürdüm, orkide ve periwinkle.",
      tip: "Mavi tabanlı pembeler ve mavi-griler yüzünü en çok aydınlatır.",
    },
    avoid: "Turuncu, altın sarısı, zeytin, siyah ve deve tüyü; ten sararır.",
    hair: {
      best: "Küllü kahve, soğuk orta kahve, küllü koyu sarı ve doğal gri.",
      avoid: "Bakır, altın röfleler ve sıcak kızıl.",
    },
    makeup: {
      lips: "Ahududu, gül, berry ve soğuk mauve.",
      blush: "Soğuk gül ve berry.",
      eyes: "Gri, lavanta, mavi gri ve erik. Gri ya da lacivert eyeliner.",
    },
    jewelry: "Gümüş, beyaz altın, platin ve rose gold arası soğuk tonlar.",
    combos: ["Lacivert ceket + ahududu bluz", "Mavi gri kazak + kırık beyaz pantolon", "Lavanta elbise + gümüş kolye"],
  },
  SS: {
    essence: "Nötr-soğuk ve yumuşak: grileşmiş, sisli, sessiz renkler. Parlak ve sert renkler fazla gelir.",
    clothes: {
      neutrals: "Kırık beyaz, gül bej, mantar grisi ve soft kömür grisi. Siyah yerine kömür grisi.",
      colors: "Deniz köpüğü, mor gri, gül kurusu, toz mavi, adaçayı, soft teal, mauve ve erik.",
      tip: "Düşük kontrastlı kombinler kur; aynı griye yakın tonları üst üste kullan.",
    },
    avoid: "Turuncu kırmızı, siyah, parlak altın sarısı, neon yeşil ve saf beyaz.",
    hair: {
      best: "Küllü kahve, sütlü kahve, küllü koyu sarı ve soft bej sarı.",
      avoid: "Mavi siyah, bakır ve parlak kızıl.",
    },
    makeup: {
      lips: "Mauve, gül kurusu, soft berry ve rose nude.",
      blush: "Gül kurusu ve soft mauve.",
      eyes: "Taupe, gri, mor gri ve soft erik. Soft kahve ya da gri eyeliner.",
    },
    jewelry: "Mat gümüş, beyaz altın ve rose gold; parlak sarı altından kaçın.",
    combos: ["Mantar grisi triko + gül kurusu pantolon", "Deniz köpüğü bluz + kömür grisi ceket", "Mor gri elbise + mat gümüş küpe"],
  },
  CW: {
    essence: "Soğuk ve net: saf, doygun, buz gibi renkler ve yüksek kontrast.",
    clothes: {
      neutrals: "Saf beyaz, siyah, kömür grisi, lacivert ve buz grisi.",
      colors: "Kraliyet mavisi, kobalt, zümrüt, teal, klasik kırmızı, fuşya, kraliyet moru ve buz pembesi.",
      tip: "Siyah–beyaz gibi yüksek kontrastlı kombinler sana yakışır; renkleri saf ve net seç.",
    },
    avoid: "Turuncu, altın sarısı, zeytin, deve tüyü ve pas; ten sararır ve donuklaşır.",
    hair: {
      best: "Doğal koyu kahve, soğuk koyu kahve, mavi siyah ve espresso.",
      avoid: "Bakır, altın röfle, bal ve sıcak karamel.",
    },
    makeup: {
      lips: "Klasik mavi kırmızı, fuşya, berry ve soğuk pembe.",
      blush: "Soğuk pembe ve berry.",
      eyes: "Gri, gümüş, lacivert, mor ve siyah eyeliner.",
    },
    jewelry: "Gümüş, beyaz altın ve platin; parlak ve net parçalar.",
    combos: ["Siyah pantolon + saf beyaz gömlek + kırmızı ruj", "Kraliyet mavisi kazak + kömür grisi pantolon", "Zümrüt elbise + gümüş küpe"],
  },
  DW: {
    essence: "Nötr-soğuk ve derin: koyu, doygun, mücevher tonları ve güçlü kontrast.",
    clothes: {
      neutrals: "Siyah, saf beyaz, kömür grisi, gece mavisi ve soğuk espresso.",
      colors: "Vişne, bordo, zümrüt, orman yeşili, safir, kraliyet moru, fuşya ve teal.",
      tip: "Koyu mücevher tonlarını yüzünün yanında kullan; açık renk istiyorsan saf beyaz ya da buz tonu seç.",
    },
    avoid: "Şeftali, deve tüyü, altın sarısı, buğday ve terrakota; yüz soluk ve bulanık görünür.",
    hair: {
      best: "Koyu çikolata, espresso, siyah kahve ve soğuk koyu kahve.",
      avoid: "Bal, karamel, altın sarı ve bakır.",
    },
    makeup: {
      lips: "Vişne, bordo, şarap ve koyu berry.",
      blush: "Berry ve koyu gül.",
      eyes: "Kömür grisi, erik, koyu yeşil, lacivert ve siyah eyeliner.",
    },
    jewelry: "Gümüş, beyaz altın ve platin; koyu taşlar (yakut, safir, zümrüt).",
    combos: ["Siyah ceket + vişne bluz", "Gece mavisi kazak + saf beyaz gömlek yaka", "Zümrüt elbise + gümüş küpe + bordo ruj"],
  },
};
