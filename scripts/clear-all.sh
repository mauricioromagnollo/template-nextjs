#!/bin/sh
#
# clear-all.sh — remove every generated, git-ignored artifact from the working
# tree, returning the clone to a freshly-cloned state.
#
# Useful when a stale build breaks the dev server, before measuring a cold build,
# or to reclaim disk space. Nothing tracked by git is ever touched: the list
# below mirrors .gitignore, so anything removed here can be regenerated with
# `make setup`.
#
# Usage: ./scripts/clear-all.sh   (or `make clean`)

set -eu

# Always operate on the repository root, no matter where the script is called
# from.
SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH='' cd -- "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

REMOVED=0
FAILED=0

# Deletes a single path if it exists, escalating to sudo only when the plain
# removal is denied. Containers that run as root (see Dockerfile.dev) leave
# root-owned files such as .next/ behind, which the host user cannot delete.
remove_path() {
  target=$1

  if [ ! -e "$target" ] && [ ! -L "$target" ]; then
    return 0
  fi

  if rm -rf "$target" 2>/dev/null; then
    printf '  removed  %s\n' "$target"
    REMOVED=$((REMOVED + 1))
    return 0
  fi

  if command -v sudo >/dev/null 2>&1 && sudo rm -rf "$target" 2>/dev/null; then
    printf '  removed  %s (sudo)\n' "$target"
    REMOVED=$((REMOVED + 1))
    return 0
  fi

  printf '  FAILED   %s\n' "$target" >&2
  FAILED=$((FAILED + 1))
  return 0
}

# Fixed paths, ordered so that the cheap ones go first and node_modules last.
TARGETS='
.next
out
build
dist
coverage
test-results
playwright-report
blob-report
playwright/.cache
site
.swc
.turbo
next-env.d.ts
node_modules
'

printf 'Cleaning generated artifacts in %s\n\n' "$ROOT_DIR"

for target in $TARGETS; do
  remove_path "$target"
done

# Globbed paths need a separate pass: an unmatched glob stays literal in POSIX
# sh, so each candidate is checked for existence first.
for target in ./*.tsbuildinfo; do
  remove_path "$target"
done

printf '\nDone: %s removed, %s failed.\n' "$REMOVED" "$FAILED"

if [ "$FAILED" -gt 0 ]; then
  printf 'Some paths could not be removed. Retry with elevated privileges.\n' >&2
  exit 1
fi
