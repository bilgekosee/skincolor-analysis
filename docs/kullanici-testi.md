# Kullanıcı testi planı

Amaç: sitenin alt ton ve sezon sonucunun, profesyonel renk analizi sonucuyla ne kadar örtüştüğünü ölçmek; renk kartı testinin kullanıcılar için ne kadar kolay olduğunu görmek.

Neden gerekli: fotoğraftan ölçülen ton açısı, 396 uzman etiketli Deep Armocromia fotoğrafında sıcak/soğuk ayrımını şans seviyesinde yaptı (%49). Bu yüzden alt tona artık renk kartları ve sorular karar veriyor. Bu iki kaynağın doğruluğu ise ancak gerçek insanlarla ölçülebilir.

## Katılımcılar

- **Sayı:** 15–20 kişi. Daha azıyla sonuçlar tesadüfe çok açık kalır.
- **Şart:** Daha önce profesyonel renk analizi (kumaşla drape) yaptırmış ve sonucunu bilen kişiler. Sonuç: alt ton (sıcak / soğuk / nötr) ve sezon.
- **Çeşitlilik:** Farklı ten tonlarından (Monk ölçeğinde açık, orta, koyu) ve en az birkaç erkek. Tek tip katılımcıyla yapılan test, sistemin genelde çalıştığını göstermez.
- **Nereden:** Renk analizi yapan danışmanların danışanları, bu konuda paylaşım yapan topluluklar, çevre.

## Kör test kuralı

- Katılımcı profesyonel sonucunu **testten sonra** söyler.
- Testi yöneten kişi kartlarda yönlendirme yapmaz ("bence bu daha iyi" demez).
- Sonuç ekranı, katılımcı kartları bitirene kadar gösterilmez ya da katılımcıdan ona bakmaması istenir.

## Uygulama (kişi başı ~15 dakika)

1. **Ortam:** Gün ışığı alan bir pencerenin karşısı, makyajsız ya da hafif makyaj, gözlüksüz, ekran parlaklığı orta, gece modu kapalı.
2. **Fotoğraf:** Sitede "Kamerayı aç" ile yüz önden, iki yanağı eşit aydınlanmış çekilir.
3. **Sorular:** 4 alt ton sorusu cevaplanır.
4. **Renk kartları:** 6 çift, "Sırayla" görünümünde. Süre tutulur.
5. **Kayıt:** Siteyi gösteren sonuç tabloya yazılır (aşağıda).
6. **Profesyonel sonuç:** Katılımcı kendi bildiği sonucu söyler.
7. **Kısa görüşme:** Kartlar 1–5 arası ne kadar zordu? En zor çift hangisiydi? Neye bakacağını anladı mı?

## Kayıt tablosu (her katılımcı için bir satır)

| Alan | Örnek |
|---|---|
| Katılımcı no | K07 |
| Cihaz | iPhone 13, Safari |
| Monk tonu (yaklaşık) | 4 |
| Profesyonel alt ton | Soğuk |
| Profesyonel sezon | Serin Kış |
| Site alt ton | Nötr-soğuk |
| Site güven | Yüksek |
| Site sezon | Serin Kış |
| Kart cevapları (6) | A, B, A, A, aynı, A |
| Soru cevapları (4) | soğuk, sıcak, soğuk, hayır |
| Fotoğraf ton açısı | 48° |
| Kart süresi | 2 dk 40 sn |
| Zorluk (1–5) | 3 |
| En zor çift | Beyazlar |
| Not | Altın/gümüşte kararsız kaldı |

Fotoğraf saklanmaz; site fotoğrafı cihazdan çıkarmıyor. Tabloya yalnızca sonuçlar yazılır. Katılımcıdan sonuçlarını kaydetmek için onay alınır.

## Ölçülecekler

- **Alt ton, tam isabet:** Site ile profesyonel sonuç aynı mı?
- **Alt ton, bir adım yakın:** Soğuk ile nötr-soğuk gibi komşu sonuçlar isabet sayılır.
- **Sezon, 4 aile:** İlkbahar / Yaz / Sonbahar / Kış aynı mı?
- **Sezon, tam:** 10 sezondan aynısı mı?
- **Güven ne kadar dürüst:** "Yüksek" güvenli sonuçlar "orta/düşük" olanlardan daha mı isabetli? Değilse güven hesabı yanıltıcıdır.
- **Hangi kart işe yarıyor:** Her çiftin cevabı profesyonel alt tonla ne sıklıkla aynı yönü gösteriyor? Şans seviyesindeki çiftler çıkarılır ya da değiştirilir.
- **Sorular mı kartlar mı:** İkisinin ayrı ayrı isabeti; ağırlıklar buna göre ayarlanır.
- **Fotoğrafın sezona katkısı:** Saç açıklığı ve kontrastın sezon ailesini doğru gösterip göstermediği.

## Başarı ölçütü

Profesyonel analistler de birbirleriyle her zaman aynı sonuca varmaz, bu yüzden %100 beklemek gerçekçi değil. Bir başlangıç hedefi:

- Alt tonda bir adım yakın isabet **%80 ve üstü**
- Sezon ailesinde isabet **%60 ve üstü** (şans %25)
- "Yüksek" güvenli sonuçlarda isabet, diğerlerinden belirgin şekilde yüksek

Bu hedeflerin altında kalınırsa site, sonucu "tahmin" olarak sunmalı ve profesyonel analize yönlendirmeli.

## Sonra

1. Sonuçlara göre soru ve kart ağırlıklarını (`src/lib/evidence.ts`), sezon eşiklerini (`seasonFor`, `src/lib/color.ts`) ayarla.
2. İşe yaramayan kart çiftlerini değiştir.
3. Aynı ölçütlerle küçük bir ikinci tur yap; değişikliğin gerçekten iyileştirip iyileştirmediğine bak.
