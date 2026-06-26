#!/usr/bin/env bash
# Stage a flat, GitHub-Pages-ready copy under dist/. Publishing (push / Pages
# branch / GitHub Classroom) is a manual step and is intentionally NOT done here.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST/shared"
cp "$ROOT"/shared/* "$DIST/shared/"

for d in "$ROOT"/week*/; do
  [ -d "$d" ] || continue
  name="$(basename "$d")"
  mkdir -p "$DIST/$name"
  cp "$d"index.html "$DIST/$name/"
  cp "$d"*.js "$DIST/$name/" 2>/dev/null || true
done

echo "Staged dist/. Review it, then publish manually (push to your Pages branch)."
