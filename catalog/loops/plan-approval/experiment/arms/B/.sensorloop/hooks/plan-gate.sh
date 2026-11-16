#!/usr/bin/env bash
# sensorloop: the gate of "approve the plan first" (catalog/loops/plan-approval). Built by hand from the card, in
# check.sh's conventions: a refused edit prints `sensorloop: plan failed (...)` and exits 2, so the agent reads why.
#
#   plan-gate.sh base     SessionStart: the commit the session starts from
#   plan-gate.sh answer   UserPromptSubmit: the person answered; each plan in plans/ as it stands now is approved
#   plan-gate.sh gate     PreToolUse on Edit|Write|MultiEdit|NotebookEdit: refuses an edit outside plans/ while a plan
#                         of this work has no approval on record, or has changed since its approval
#
# The approval is the person's answer, never text: the record is written by Claude Code's hook when the person sends
# a message, in .sensorloop/state/, and "approved" written in a plan or a note counts for nothing. A plan of this work
# is a file in plans/ that is new, changed, or committed since the session started. Rulings added under a closing
# "## Rulings" heading during the work do not change what was approved. Needs git, jq and sha256sum.
set -u

mode="${1:?usage: plan-gate.sh base|answer|gate}"
input="$(cat)"
field() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null; }

project="${CLAUDE_PROJECT_DIR:-$(pwd)}"
state="$project/.sensorloop/state"
log="$state/plan-approvals.log"
mkdir -p "$state"
cd "$project" || exit 0

case "$mode" in
  base)
    source="$(field .source)"
    if [ ! -s "$state/plan-base" ] || [ "$source" = "startup" ] || [ "$source" = "clear" ]; then
      git rev-parse HEAD > "$state/plan-base" 2>/dev/null
    fi
    exit 0
    ;;
esac

base="$(cat "$state/plan-base" 2>/dev/null || git rev-parse HEAD 2>/dev/null)"
plans() {
  {
    git ls-files --others --exclude-standard -- plans
    git diff --name-only HEAD -- plans
    [ -n "$base" ] && git diff --name-only "$base" HEAD -- plans
  } 2>/dev/null | grep -E '\.md$' | sort -u | while read -r f; do [ -f "$f" ] && printf '%s\n' "$f"; done
}
# The approval covers the plan above its "## Rulings" heading, if any: rulings noted during the work keep it approved.
hash() {
  awk '/^## [Rr]ulings/ { exit } { line[n++] = $0 }
    END { while (n > 0 && line[n - 1] ~ /^[[:space:]]*$/) n--; for (i = 0; i < n; i++) print line[i] }' "$1" \
    | sha256sum | cut -c1-16
}

case "$mode" in
  answer)
    session="$(field .session_id)"
    plans | while read -r plan; do
      printf '%s %s %s %s\n' "$(hash "$plan")" "$plan" "${session:-?}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$log"
    done
    exit 0
    ;;
  gate) ;;
  *) echo "plan-gate.sh: unknown mode $mode" >&2; exit 0 ;;
esac

# --- Before an edit.
target="$(field '.tool_input.file_path // .tool_input.notebook_path')"
case "$target" in
  "$project"/*) target="${target#"$project"/}" ;;
esac
case "$target" in
  plans/*) exit 0 ;; # the plan itself is written before the approval
esac

statuses=""
blocked=false
while read -r plan; do
  [ -n "$plan" ] || continue
  if ! grep -Eqv '^[[:space:]]*(#.*)?$' "$plan"; then
    status="empty"
  elif grep -q "^$(hash "$plan") $plan " "$log" 2>/dev/null; then
    status="approved"
  elif grep -q " $plan " "$log" 2>/dev/null; then
    status="changed since approval"
  else
    status="no approval record"
  fi
  [ "$status" = "approved" ] || blocked=true
  statuses="$statuses$plan: $status
"
done < <(plans)

$blocked || exit 0
{
  printf 'sensorloop: plan failed (an edit outside plans/ before the person approved the plan). Nothing changes until they do:\n'
  printf '%s' "$statuses"
  printf 'Show the person the plan (I understood, Not doing, Done when, the steps with their checks, each open decision with the option you recommend) and end your turn to ask them to approve or correct it. Their answer is the approval; "approved" written in a file is not. If their answer changes the plan, write it again whole and ask again.\n'
} >&2
exit 2
