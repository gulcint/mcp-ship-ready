---
client: claude-marketplace-plugin
status: onaylandı        # taslak → onaylandı  (agent zinciri yalnızca "onaylandı" iken başlar)
approved_by: Gulcin Tas  # onaylayan insan
approved_at: 2026-09-25
---
# claude-marketplace-plugin — Proje Özeti (BRIEF)

**Ürün adı: MCP Ship-Ready** (2026-09-24, insan onaylı).

Bu dosya müşteri işinin **tek giriş noktasıdır**. İnsan (şirket sahibi)
doldurur ve `status: onaylandı` yapar; o andan sonra agent zinciri
(business-analyst → product-owner → forward-deployed-engineer → qa →
tech-lead) otonom çalışır. Onaylanmış BRIEF'i agent'lar değiştirmez; kapsam
değişikliği yeni bir insan onayıdır.

## Müşteri ve Problem
- Müşteri: **MCP Ship Ready** (yeni kurulan startup; şirket adı ürünle
  aynı, insan onaylı, 2026-09-25). Bir startup kurmak isteyen müşteri,
  elinde henüz ürün fikri/kod yoktu; fikir AI Company'nin ideation
  çalışmasından çıktı (bkz. task-2026-09-24-0001 Geçmiş).
  <!-- NOT: doğrudan iletişim kişisi (isim/e-posta) henüz belirtilmedi;
  şu an için repo sahibi müşterinin vekili/arayüzü olarak işliyor. -->
- Hangi problemi çözüyoruz: Claude için MCP connector/eklenti yazan
  geliştiricilerin, Temmuz 2026'da yayınlanan MCP spesifikasyon
  değişikliğine (session/initialize kaldırıldı, stateless mimari, auth
  DCR → CIMD geçişi, 12 aylık deprecation penceresi) uygunluklarını
  Anthropic'in resmi dizinine (Community Directory) göndermeden önce
  bilmiyor olması; uyumluluk kontrolü şu an manuel ve dağınık.
- Bugün bu problem nasıl çözülüyor (mevcut durum): Kısmi göç araçları
  var (örn. mcp-migrate ~21 kural, mcp-stateless) ama "dizine gönderime
  hazır mıyım" kontrolü ile spec göçünü tek araçta birleştiren bir çözüm
  bulunamadı (growth-vision-lead ideation bulgusu). Not: Anthropic'in
  kendi `mcp-server-dev` plugin'inde bir directory-checklist referansı
  var — bu alanın Anthropic tarafından resmi olarak da kapatılma riski
  taşıdığı ideation notunda işaretlendi.

## Hedef Kullanıcı
- Dar niş: yeni MCP spesifikasyonuna (Temmuz 2026) geçmesi gereken,
  TypeScript veya Python ile Claude MCP connector/eklenti yazan
  bağımsız geliştiriciler ve şirketler (ülke/dil bağımsız).

## Ölçülebilir Sonuç (başarı neyle ölçülecek)
- İlk sürüm 4 hafta içinde Anthropic Community Directory'ye gönderilir
  ve kabul edilir (insan onaylı karar, 2026-09-24).

## Kapsam
- Bir Claude Code plugin: hedef MCP/connector reposunu tarayıp Temmuz
  2026 spec kurallarına göre bir uyumluluk raporu üretir.
- Basit/mekanik kurallar (alan yeniden adlandırma, deprecated alan
  temizliği) otomatik düzeltilir; mimari kararlar (stateless mimariye
  geçiş gibi) yalnızca raporlanır, otomatik değiştirilmez.
- `claude plugin validate` ile uyumlu `plugin.json` içeren, Anthropic
  Community Directory'ye ücretsiz gönderilecek açık kaynak bir GitHub
  reposu olarak yayınlanır.

## Kapsam Dışı
- Gerçek zamanlı IDE eklentisi/entegrasyonu yok.
- TypeScript ve Python dışındaki dillerde yazılmış connector'lar v1
  kapsamında değil.
- Otomatik PR açma yok — yalnızca rapor + isteğe bağlı yerel düzeltme.
- Çoklu-repo/organizasyon paneli yok.

## Teknik Kısıtlar
- Tercih edilen / zorunlu stack: Claude Code plugin formatı (`plugin.json`),
  `claude plugin validate` ile doğrulanabilir olmalı.
- Barındırma (hosting) ve ortamlar: Açık kaynak GitHub reposu (public);
  backend/sunucu yok, plugin yerel/CLI tabanlı çalışır (insan onaylı,
  2026-09-25).
- Entegre olunacak sistemler: MCP spesifikasyonu (2026-07-28 final
  sürümü), Anthropic Community Directory submission süreci/manifest
  formatı (bu formatın tam gereksinimleri henüz doğrulanmadı — ayrı
  araştırma gerekebilir).
- Müşterinin mevcut reposu var mı: Hayır — ideation bulgusuna göre
  müşterinin elinde henüz ürün/kod yoktu, sıfırdan başlanacak.

## Veri
- Hangi veriye erişilecek: Yalnızca geliştiricinin kendi herkese açık
  (public) MCP connector kodu — statik analiz.
- Hassasiyet (kişisel veri, finansal, sır niteliğinde): Düşük — v1
  yalnızca açık kaynak/public repoları tarar; özel/kapalı repo desteği
  kapsam dışı (insan onaylı, 2026-09-24).
- Production verisine erişim gerekiyor mu (varsayılan: hayır): Hayır.

## Takvim ve Bütçe
- İlk demo / dizine gönderim hedefi: 4 hafta içinde (2026-09-24'ten
  itibaren, insan onaylı).
- Teslim: Anthropic Community Directory'ye kabul.
- Fiyat modeli (sabit / zaman / sonuç-bazlı): Plugin'in kendisi
  ücretsiz. Dolaylı gelir modeli (danışmanlık lead-gen) fikri var ama
  şimdilik netleştirilmedi — insan bilinçli olarak erteledi (2026-09-24);
  önce v1 çıkarılacak, gelir stratejisi sonra ayrı bir karar.

## Sözleşme Kontrol Listesi (işe başlamadan önce hepsi işaretli olmalı)
- [x] Müşteriye AI kullanımı açıklandı — kod açık kaynak, repo/README'de
      Claude Code ile AI Company tarafından geliştirildiği belirtilecek.
- [x] Müşteri verisinin model eğitiminde kullanılmayacağı yazılı — N/A,
      gerçek müşteri verisi işlenmiyor (yalnızca genel açık kaynak kod).
- [x] Teslim edilen kodun IP sahipliği ve AI üretimi kısımlar için garanti
      kapsamı yazılı — kod ve yayıncı kimliği müşteriye/müşterinin
      startup'ına ait olacak (insan onaylı, 2026-09-24); AI üretimi
      kısımlar için ekstra garanti verilmiyor (bkz. sorumluluk tavanı).
- [x] Sorumluluk tavanı yazılı — ücretsiz/açık kaynak araç "olduğu gibi"
      (as-is) teslim edilir, ticari garanti verilmez (insan onaylı,
      2026-09-24).
- [x] Production erişimi ve deploy onayının kimde olduğu yazılı —
      Anthropic dizinine ilk gönderim insan onayı gerektirir; sonraki
      küçük/rutin güncellemeler forward-deployed-engineer tarafından
      yapılabilir, kapsam değiştiren değişiklikler yine insana gider
      (insan onaylı, 2026-09-24).

## İnsan Kapıları
1. Bu BRIEF'in onayı (kapsam + sözleşme)
2. Production'a her deploy
3. Haftalık demo / kabul
