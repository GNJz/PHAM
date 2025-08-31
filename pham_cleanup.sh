#!/usr/bin/env bash
set -euo pipefail

# === 설정 ===
IMAGES_DIR="웹사이트 원본 저장/images"   # 이미지 최종 보관 위치 (공백/한글 포함 → 반드시 따옴표 유지)
TS="$(date +%F_%H%M%S)"                 # 타임스탬프
BACKUP_DIR="backup"
BACKUP_TGZ="${BACKUP_DIR}/PHAM_${TS}.tar.gz"
TAG="backup-${TS}"

# === 준비점검 ===
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ 여기는 git 저장소가 아닙니다. PHAM 레포지토리 폴더에서 실행하세요."
  exit 1
fi

# 작업트리 변화가 있다면 임시 커밋(선택)
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "chore: WIP before pham cleanup (${TS})"
fi

# === 1) 전체 백업(tar.gz) + 태그 ===
mkdir -p "${BACKUP_DIR}"
git archive --format=tar.gz -o "${BACKUP_TGZ}" HEAD
git add "${BACKUP_TGZ}" || true
git commit -m "backup: snapshot ${TS}" || true
git tag -a "${TAG}" -m "Snapshot before cleanup ${TS}"

# === 2) 최종 이미지 폴더 생성 ===
mkdir -p "${IMAGES_DIR}"

# === 3) 루트(및 최상위) 중복 이미지 이동 ===
#   - 루트에 흩어진 이미지 파일들을 IMAGES_DIR로 모읍니다.
find . -maxdepth 1 -type f \( \
  -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o \
  -iname "*.gif" -o -iname "*.webp" -o -iname "*.svg" \
\) -print0 | while IFS= read -r -d '' f; do
  base="$(basename "$f")"
  # 같은 이름이 이미 있으면 덮어쓰기 방지
  if [ -e "${IMAGES_DIR}/${base}" ]; then
    mv -vn "$f" "${IMAGES_DIR}/${TS}_${base}"
  else
    mv -vn "$f" "${IMAGES_DIR}/"
  fi
done

# === 4) 파일명 정규화 (소문자, 공백→_, 확장자 .jpg 통일(가능한 경우)) ===
normalize_name() {
  local in="$1"
  # 소문자
  local out="$(echo "$in" | tr '[:upper:]' '[:lower:]')"
  # 공백/괄호 등 → _
  out="${out// /_}"
  out="${out//(/_}"
  out="${out//)/_}"
  out="${out//__/_}"
  # " 2" 같은 중복표기 제거
  out="$(echo "$out" | sed 's/_\{1,\}[0-9]\{1,\}\.jpg$/\.jpg/; s/ 2//g')"
  # jpeg → jpg
  out="$(echo "$out" | sed 's/\.jpeg$/.jpg/')"
  echo "$out"
}

# IMAGES_DIR 내부 정규화
find "${IMAGES_DIR}" -type f -print0 | while IFS= read -r -d '' f; do
  dir="$(dirname "$f")"
  base="$(basename "$f")"
  new="$(normalize_name "$base")"
  # 중복 충돌시 접미어 부여
  if [ "$base" != "$new" ]; then
    target="${dir}/${new}"
    if [ -e "$target" ]; then
      ext="${new##*.}"
      stem="${new%.*}"
      i=2
      while [ -e "${dir}/${stem}_v${i}.${ext}" ]; do i=$((i+1)); done
      target="${dir}/${stem}_v${i}.${ext}"
    fi
    git mv -v "$f" "$target" || mv -v "$f" "$target"
  fi
done

# === 5) .DS_Store 제거 + .gitignore 반영 ===
find . -name ".DS_Store" -delete
# backup 폴더 정책: tar.gz만 보관
{
  echo ".DS_Store"
  echo "backup/*"
  echo "!backup/*.tar.gz"
} | sort -u >> .gitignore
git add .gitignore

# === 6) 커밋 & 푸시 ===
git add -A
git commit -m "refactor: unify images under '${IMAGES_DIR}', normalize names; chore: ignore .DS_Store; backup ${TS}"
git push
git push --tags

echo "✅ 정리 완료!"
echo "• 백업: ${BACKUP_TGZ}"
echo "• 태그: ${TAG}"
echo "• 이미지 폴더: ${IMAGES_DIR}"
echo "되돌리기: git reset --hard ${TAG} (또는) git checkout ${TAG}"
