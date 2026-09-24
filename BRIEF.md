---
client: claude-marketplace-plugin
status: taslak        # taslak → onaylandı  (agent zinciri yalnızca "onaylandı" iken başlar)
approved_by:          # onaylayan insan
approved_at:          # YYYY-MM-DD
---
# claude-marketplace-plugin — Proje Özeti (BRIEF)

Bu dosya müşteri işinin **tek giriş noktasıdır**. İnsan (şirket sahibi)
doldurur ve `status: onaylandı` yapar; o andan sonra agent zinciri
(business-analyst → product-owner → forward-deployed-engineer → qa →
tech-lead) otonom çalışır. Onaylanmış BRIEF'i agent'lar değiştirmez; kapsam
değişikliği yeni bir insan onayıdır.

## Müşteri ve Problem
- Müşteri:
- Hangi problemi çözüyoruz:
- Bugün bu problem nasıl çözülüyor (mevcut durum):

## Hedef Kullanıcı
-

## Ölçülebilir Sonuç (başarı neyle ölçülecek)
<!-- örn. "fatura işleme süresi 2 günden 2 saate", "haftalık 50 manuel
     işlemin 40'ı otomatik". Sonuç-bazlı fiyatlama ancak bu netse mümkün. -->
-

## Kapsam
-

## Kapsam Dışı
-

## Teknik Kısıtlar
- Tercih edilen / zorunlu stack:
- Barındırma (hosting) ve ortamlar:
- Entegre olunacak sistemler:
- Müşterinin mevcut reposu var mı:

## Veri
- Hangi veriye erişilecek:
- Hassasiyet (kişisel veri, finansal, sır niteliğinde):
- Production verisine erişim gerekiyor mu (varsayılan: hayır):

## Takvim ve Bütçe
- İlk demo:
- Teslim:
- Fiyat modeli (sabit / zaman / sonuç-bazlı):

## Sözleşme Kontrol Listesi (işe başlamadan önce hepsi işaretli olmalı)
- [ ] Müşteriye AI kullanımı açıklandı
- [ ] Müşteri verisinin model eğitiminde kullanılmayacağı yazılı
- [ ] Teslim edilen kodun IP sahipliği ve AI üretimi kısımlar için garanti kapsamı yazılı
- [ ] Sorumluluk tavanı yazılı
- [ ] Production erişimi ve deploy onayının kimde olduğu yazılı

## İnsan Kapıları
1. Bu BRIEF'in onayı (kapsam + sözleşme)
2. Production'a her deploy
3. Haftalık demo / kabul
