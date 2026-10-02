#!/usr/bin/env bash
# Assembles the publishable site into _site/ from tracked files only, so no
# untracked or ignored file can ever ship.
#
# git archive piped into tar hides its own failure: tar succeeds on empty
# input, so the pipeline exits 0 with a near-empty directory. pipefail plus
# the file-count floor below turn that into a loud failure instead.
set -euo pipefail

OUT="${1:-_site}"

rm -rf "$OUT"
mkdir -p "$OUT"
git archive HEAD index.html styles.css scripts data images _headers | tar -x -C "$OUT"
touch "$OUT/.nojekyll"

count=$(find "$OUT" -type f | wc -l | tr -d ' ')
if [ "$count" -lt 50 ]; then
  echo "build-site: assembled only $count files, expected at least 50" >&2
  echo "build-site: are index.html, styles.css, scripts, data, images and _headers all committed?" >&2
  exit 1
fi

echo "build-site: $count files, $(du -sh "$OUT" | cut -f1)"
