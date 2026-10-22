#!/usr/bin/env bash
# Install ui-preview-gate for Codex and/or Claude Code.
#   ./install.sh                     # copy the skill for both agents
#   ./install.sh --codex             # only Codex  (~/.codex/skills)
#   ./install.sh --claude            # only Claude Code (~/.claude/skills)
#   ./install.sh --with-instructions # also add the per-turn rule to
#                                    # ~/.codex/AGENTS.md and/or ~/.claude/CLAUDE.md
# Re-running is safe: the skill is replaced, and the rule block between the
# ui-preview-gate:start/end markers is updated in place (added once if missing).
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
src="$here/ui-preview-gate"
codex=0 claude=0 instructions=0
for arg in "$@"; do
  case "$arg" in
    --codex) codex=1 ;;
    --claude) claude=1 ;;
    --with-instructions) instructions=1 ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 1 ;;
  esac
done
if [ "$codex" = 0 ] && [ "$claude" = 0 ]; then codex=1 claude=1; fi

install_one() { # <skills dir> <instructions file>
  mkdir -p "$1"
  rm -rf "$1/ui-preview-gate"
  cp -R "$src" "$1/ui-preview-gate"
  echo "installed skill -> $1/ui-preview-gate"
  if [ "$instructions" = 1 ]; then
    if [ -f "$2" ] && grep -q 'ui-preview-gate:start' "$2"; then
      if ! grep -q 'ui-preview-gate:end' "$2"; then
        echo "warning: $2 has ui-preview-gate:start but no end marker; rule not updated" >&2
        return 0
      fi
      tmp="$(mktemp)"
      awk -v f="$src/agent-instructions.md" '
        /ui-preview-gate:start/ { while ((getline l < f) > 0) print l; skip = 1; next }
        skip && /ui-preview-gate:end/ { skip = 0; next }
        !skip { print }' "$2" > "$tmp"
      cat "$tmp" > "$2"
      rm -f "$tmp"
      echo "updated rule in $2"
    else
      mkdir -p "$(dirname "$2")"
      { [ -s "$2" ] && echo; cat "$src/agent-instructions.md"; } >> "$2"
      echo "added rule -> $2"
    fi
  fi
}

[ "$codex" = 1 ] && install_one "${CODEX_HOME:-$HOME/.codex}/skills" "${CODEX_HOME:-$HOME/.codex}/AGENTS.md"
[ "$claude" = 1 ] && install_one "$HOME/.claude/skills" "$HOME/.claude/CLAUDE.md"
if [ "$instructions" = 0 ]; then
  echo "tip: re-run with --with-instructions so the skill is also used in follow-up turns"
fi
