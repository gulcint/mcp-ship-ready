#!/usr/bin/env bash
# Test bütünlüğü kontrolü — CI'da her PR için çalışır (.github/workflows/ci.yml).
#
# Neden: CI'ın yeşil olması, testler silinmiş/atlanmış/zayıflatılmışsa bir şey
# kanıtlamaz. AI agent'ları başarısız testi düzeltmek yerine testi
# değiştirmeye eğilimlidir. Bu script PR diff'inde bunu yakalar ve CI'ı
# kırmızıya çevirir. Karar LLM'e değil deterministik koda bırakılır
# (ILETISIM-KURALLARI.md "Karar Mekanizması Seçimi").
#
# Kullanım: scripts/ci/test-integrity.sh <base-ref>   (örn. origin/main)
# Çıkış kodu: 0 = temiz, 1 = ihlal, 2 = kullanım hatası.

set -euo pipefail

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "kullanım: $0 <base-ref>" >&2
  exit 2
fi

# Test dosyası sayılan yollar (JS/TS, Python, Go, Java/Kotlin).
TEST_PATH_RE='(^|/)(__tests__|tests?)/|\.(test|spec)\.[cm]?[jt]sx?$|(^|/)test_[^/]*\.py$|_test\.(py|go)$|Test\.(java|kt)$'

# Testi devre dışı bırakan işaretler.
SKIP_RE='\b(it|test|describe|context)\.(skip|only|todo)\b|\b(xit|xdescribe|xtest|fit|fdescribe)\s*\(|@pytest\.mark\.(skip|xfail)|pytest\.skip\(|unittest\.skip|@Disabled\b|@Ignore\b|\bt\.Skip(Now|f)?\('

# Assertion sayılan ifadeler.
ASSERT_RE='\bexpect\s*\(|\bassert[A-Za-z_]*\s*[\(.]|\bassert\s|\.should\b|\b(require|assert)\.[A-Za-z]+\(|\bt\.(Error|Fatal)f?\('

RANGE="$BASE...HEAD"
violations=0

report() {
  echo "::error::$1"
  violations=$((violations + 1))
}

# 1) Silinmiş test dosyası
deleted=$(git diff --diff-filter=D --name-only "$RANGE" | grep -E "$TEST_PATH_RE" || true)
if [[ -n "$deleted" ]]; then
  while IFS= read -r f; do
    report "Test dosyası silinmiş: $f"
  done <<< "$deleted"
fi

# Değişen (silinmemiş) test dosyaları
changed=$(git diff --diff-filter=AMR --name-only "$RANGE" | grep -E "$TEST_PATH_RE" || true)

added_asserts=0
removed_asserts=0
if [[ -n "$changed" ]]; then
  while IFS= read -r f; do
    diff_body=$(git diff -U0 "$RANGE" -- "$f" | grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' || true)

    # 2) Yeni eklenen skip/only/xit vb.
    skips=$(printf '%s\n' "$diff_body" | grep -E '^\+' | grep -E "$SKIP_RE" || true)
    if [[ -n "$skips" ]]; then
      while IFS= read -r line; do
        report "Test devre dışı bırakılmış ($f): ${line:1}"
      done <<< "$skips"
    fi

    a=$(printf '%s\n' "$diff_body" | grep -E '^\+' | grep -cE "$ASSERT_RE" || true)
    r=$(printf '%s\n' "$diff_body" | grep -E '^-' | grep -cE "$ASSERT_RE" || true)
    added_asserts=$((added_asserts + a))
    removed_asserts=$((removed_asserts + r))
  done <<< "$changed"
fi

# 3) Net assertion kaybı (test dosyalarında eklenenden fazla assertion silinmiş)
# Silinen test dosyalarındaki assertion'lar zaten 1. kontrolde ihlal.
if (( removed_asserts > added_asserts )); then
  report "Test dosyalarında net assertion kaybı: $removed_asserts silindi, $added_asserts eklendi."
fi

echo "Test bütünlüğü: silinen test dosyası=$(printf '%s' "$deleted" | grep -c . || true), assertion +$added_asserts/-$removed_asserts, ihlal=$violations"

if (( violations > 0 )); then
  echo "SONUÇ: İHLAL — testi değiştirerek geçirme şüphesi. Gerçek bir test refactor'ü ise gerekçe PR açıklamasına yazılır ve merge kararını insan verir."
  exit 1
fi
echo "SONUÇ: temiz"
