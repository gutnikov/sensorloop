#!/usr/bin/env bash
# sensorloop: runs one of the project's checks from a Claude Code hook, and turns its failure into a signal the agent
# reads. Copied into the project as .sensorloop/hooks/check.sh; the commands it runs are the project's own.
#
#   check.sh <label> <command>                   after an edit (PostToolUse) or before the turn ends (Stop)
#   check.sh --on-git-commit <label> <command>   before a Bash call that runs `git commit` (PreToolUse on Bash)
#
# On a failure it prints the label, the command and the end of its output to stderr and exits 2: Claude Code shows
# that to the agent, and refuses the commit or keeps the turn going. Before the turn ends, the same failure three
# times in a row hands the work to the person instead of going round again. Bash only, no other tools needed.
set -u

only_commit=false
if [ "${1:-}" = "--on-git-commit" ]; then
  only_commit=true
  shift
fi
label="${1:?usage: check.sh [--on-git-commit] <label> <command>}"
command="${2:?usage: check.sh [--on-git-commit] <label> <command>}"

input="$(cat)"

# Before a commit: run only when the Bash call commits.
if $only_commit && ! printf '%s' "$input" | grep -Eq '"command"[[:space:]]*:[[:space:]]*"([^"]*[^"[:alnum:]_-])?git[[:space:]]([^"&;|]*[[:space:]])?commit([[:space:]]|")'; then
  exit 0
fi

project="${CLAUDE_PROJECT_DIR:-$(pwd)}"
state="$project/.sensorloop/state"
mkdir -p "$state"
streak_file="$state/$label.streak"

output="$(cd "$project" && bash -c "$command" 2>&1)"
status=$?

if [ $status -eq 0 ]; then
  rm -f "$streak_file"
  exit 0
fi

tail_lines="$(printf '%s\n' "$output" | tail -n 60)"
# The same failure prints differently from run to run (durations, timestamps, temporary paths, warnings around it), so
# the fingerprint keeps only the lines that report the failure, with numbers and temporary paths blanked out.
signature="$(printf '%s\n' "$tail_lines" | grep -Ei 'error|fail|assert|exception|traceback' || true)"
[ -n "$signature" ] || signature="$tail_lines"
fingerprint="$(printf '%s\n' "$signature" \
  | sed -E 's#(/private)?/(tmp|var/folders)/[^[:space:]:]*#<tmp>#g; s/[0-9]+([.:][0-9]+)*/#/g' | cksum | cut -d' ' -f1)"

# Before the turn ends: count the same failure in a row; the third one goes to the person.
if printf '%s' "$input" | grep -Eq '"hook_event_name"[[:space:]]*:[[:space:]]*"Stop"'; then
  previous="$(cat "$streak_file" 2>/dev/null || true)"
  count=1
  if [ "${previous%% *}" = "$fingerprint" ]; then
    count=$(( ${previous##* } + 1 ))
  fi
  printf '%s %s\n' "$fingerprint" "$count" > "$streak_file"
  if [ "$count" -ge 3 ]; then
    rm -f "$streak_file"
    message="sensorloop: $label still fails the same way after 3 rounds; over to you (\`$command\`)."
    printf '{"systemMessage": "%s"}\n' "$(printf '%s' "$message" | sed 's/["\\]/\\&/g')"
    exit 0
  fi
fi

{
  printf 'sensorloop: %s failed (`%s`, exit %s). Fix the code, not the check. The end of its output:\n' \
    "$label" "$command" "$status"
  printf '%s\n' "$tail_lines"
} >&2
exit 2
