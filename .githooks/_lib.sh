# Ortak yardımcılar — .githooks/* tarafından source edilir.
# Operasyonel (ops) yollar: kod değil, agent run'larının ürettiği kayıtlar.
# Bunlar main'e doğrudan commit/push edilebilir (GIT-KURALLARI.md §12).
OPS_PATH_RE='^(reports|memory|logs)/'

# stdin'den gelen dosya listesinde ops dışı yol var mı? (varsa 1)
has_non_ops_paths() {
  local f
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    if ! [[ "$f" =~ $OPS_PATH_RE ]]; then
      echo "$f"
      return 0
    fi
  done
  return 1
}
