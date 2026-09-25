# claude-marketplace-plugin — Müşteri Projesi

Bu repo **claude-marketplace-plugin** müşterisinin projesidir. AI Company (`ai-company`
reposu) bu projeyi agent zinciriyle geliştirir. Şirketin kuralları burada
da aynen geçerlidir; bu dosya yalnızca müşteriye özgü olanı ekler.

## Önce Oku
1. `BRIEF.md` — kapsam, ölçülebilir sonuç, kısıtlar. `status: onaylandı`
   değilse **hiçbir implementasyon başlamaz**; yalnızca netleştirme
   soruları sorulur.
2. Şirket kuralları (ai-company reposunda): `GIT-KURALLARI.md`,
   `ILETISIM-KURALLARI.md`, `CLAUDE.md` "Kritik Kurallar".
3. `tasks/` — bu müşterinin ticket'ları (tek gerçek kaynak).

## Müşteriye Özgü Kurallar
- **İzolasyon:** Bu reponun kodu, verisi veya içeriği şirketin başka bir
  müşteri reposuna ya da `ai-company` reposuna kopyalanmaz. Tekrar
  kullanılabilir bir fikir görülürse FDE journal'ına `URUNLESME-ADAYI`
  satırı yazılır; genelleştirme ayrı bir `kind: product` görevidir.
- **Veri:** Gerçek müşteri verisi (kişisel/finansal/sır) prompt'a, log'a,
  test fixture'ına veya commit'e maskelenmeden girmez; sentetik veri
  kullanılır. `.env` ve secret asla commit'lenmez (pre-commit hook'u
  engeller).
- **Production:** Agent'ların production kimlik bilgisi yoktur. Her
  production deploy insan onayı ister (BRIEF "İnsan Kapıları").
- **Kapsam:** `BRIEF.md`'deki "Kapsam Dışı" ile çelişen iş yapılmaz;
  kapsam değişikliği insana eskale edilir (`to: human`).

## İş Akışı
- Ticket'lar `tasks/<task_id>.md` (şablon: `tasks/TEMPLATE.md`),
  `kind: client`, `client: claude-marketplace-plugin`.
- Spec-first: Spec → Plan → önce test → küçük diff → Doğrulama Kanıtı.
- Her görev kendi branch'inde (`<rol>/<task_id>-<açıklama>`), görev
  bitince commit + push + PR; merge CI yeşilken Tech Lead'de.

## İlk Görev (proje kurulumu)
Stack BRIEF'e göre seçildikten sonra ilk görev:
- Proje iskeleti + test çalıştırıcısı kurulur.
- `.github/workflows/ci.yml`'a stack'in test/lint/typecheck job'ı eklenir
  (şu an yalnızca `test-integrity` var).
- Bu dosyanın altına "Komutlar" bölümü eklenir (kurulum, test, çalıştırma).

## Stack Kararı (task-2026-09-25-0002)
TypeScript, Node'un native type-stripping desteğiyle (`node
--experimental-strip-types`, Node >=22.6.0) build adımı olmadan doğrudan
çalıştırılır. Gerekçe: sıfır çalışma-zamanı bağımlılığı (CLI arg parse
için `node:util` `parseArgs`, test için `node:test` — ikisi de Node
çekirdeğinde), bu da Claude Code plugin olarak dağıtımı basitleştirir
(kullanıcı `npm install` çalıştırmadan `/mcp-ship-ready:scan` komutunu
kullanabilir). Hedef tarama dili (TS/Python connector repoları) ile
plugin'in kendi implementasyon dili bağımsızdır (ticket'ta izin verilen
karar). devDependency'ler (`typescript`, `eslint`, `typescript-eslint`)
yalnızca geliştirme/CI zamanında gerekir.

## Komutlar
```bash
npm install         # devDependencies (typescript, eslint, typescript-eslint)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint src tests
npm test            # node --experimental-strip-types --test
npm run check       # yukarıdaki üçü sırayla
npm run cli -- scan <repo-path>   # CLI'ı doğrudan çalıştır

claude plugin validate .          # plugin.json + komut/skill doğrulaması
```
