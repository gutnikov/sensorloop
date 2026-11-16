#!/usr/bin/env bash
# sensorloop: the gate of the fresh-context code review (catalog/loops/agent-code-review). Built by hand from the
# card, in check.sh's conventions: a refusal prints `sensorloop: review failed (...)` and exits 2, so the agent reads
# it and its turn goes on; the same refusal three times in a row hands the work to the person instead.
#
#   review.sh base     SessionStart: the commit the session starts from is the base of the review
#   review.sh start    SubagentStart (code-reviewer): the commit a review is reading
#   review.sh record   SubagentStop (code-reviewer): that commit has a review on record, and its report is kept
#   review.sh stop     Stop: refuses to end the turn while the latest commit has no review on record
#
# The record is written by Claude Code's hooks when the reviewer finishes, not by the coding agent. Needs git and jq.
set -u

mode="${1:?usage: review.sh base|start|record|stop}"
reviewer="code-reviewer"
max_reviews=4 # the first review and three rounds of fixes

input="$(cat)"
field() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null; }

project="${CLAUDE_PROJECT_DIR:-$(pwd)}"
state="$project/.sensorloop/state"
mkdir -p "$state/reviews"
cd "$project" || exit 0
head="$(git rev-parse HEAD 2>/dev/null)" || exit 0

case "$mode" in
  base)
    # A new session starts a new review; a resumed or compacted one keeps its base.
    source="$(field .source)"
    if [ ! -s "$state/review-base" ] || [ "$source" = "startup" ] || [ "$source" = "clear" ]; then
      printf '%s\n' "$head" > "$state/review-base"
      : > "$state/reviews.log"
      rm -f "$state/review-pending" "$state/review.streak"
    fi
    exit 0
    ;;
  start)
    [ "$(field .agent_type)" = "$reviewer" ] || exit 0
    printf '%s\n' "$head" > "$state/review-pending"
    exit 0
    ;;
  record)
    [ "$(field .agent_type)" = "$reviewer" ] || exit 0
    reviewed="$(cat "$state/review-pending" 2>/dev/null || printf '%s' "$head")"
    rm -f "$state/review-pending"
    report="$(field .last_assistant_message)"
    # A review that did not finish is not a review: it must end with its verdict.
    printf '%s' "$report" | grep -q 'VERDICT:' || exit 0
    n=$(( $(wc -l < "$state/reviews.log" 2>/dev/null || echo 0) + 1 ))
    file="$state/reviews/$n-${reviewed:0:7}.md"
    printf '%s\n' "$report" > "$file"
    printf '%s %s %s\n' "$reviewed" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${file#"$project"/}" >> "$state/reviews.log"
    exit 0
    ;;
  stop) ;;
  *) echo "review.sh: unknown mode $mode" >&2; exit 0 ;;
esac

# --- Before the turn ends.
base="$(cat "$state/review-base" 2>/dev/null)"
if [ -z "$base" ]; then
  printf '%s\n' "$head" > "$state/review-base"
  exit 0
fi
reviews="$(wc -l < "$state/reviews.log" 2>/dev/null | tr -d ' ')"
reviews="${reviews:-0}"
dirty="$(git status --porcelain --untracked-files=normal | head -n 5)"

reason=""
todo=""
if [ -s "$state/review-pending" ] && [ -n "$(find "$state/review-pending" -mmin -15 2>/dev/null)" ]; then
  reason="the code-reviewer is still reviewing $(cut -c1-7 "$state/review-pending")"
  todo="Wait for its report, then act on it as .sensorloop/LOOPS.md says; do not start another review of the same commit."
elif [ -n "$dirty" ]; then
  reason="the work is not committed"
  todo="The reviewer reads only what is committed. Run the tests, commit the work (or remove what does not belong in it), then ask the code-reviewer agent to review it, as .sensorloop/LOOPS.md says. Not committed:
$dirty"
elif [ "$head" = "$base" ]; then
  exit 0 # nothing committed in this session, nothing to review
elif grep -q "^$head " "$state/reviews.log" 2>/dev/null; then
  rm -f "$state/review.streak"
  exit 0
elif [ "$reviews" -ge "$max_reviews" ]; then
  rm -f "$state/review.streak"
  message="sensorloop: review: $reviews reviews on record, the first and three rounds of fixes. Write a ruling for each high finding still open in your report; one you cannot rule on without guessing goes to the person."
  jq -cn --arg m "$message" '{systemMessage: $m}'
  exit 0
else
  short="$(git rev-parse --short HEAD)"
  if [ "$reviews" -eq 0 ]; then
    reason="the latest commit, $short, has no review on record"
    todo="Ask the code-reviewer agent (the Agent tool, subagent_type \"code-reviewer\") to review \`git diff ${base:0:7}...HEAD\`. Give it the task word for word and the base commit, nothing of your own reasoning. Then fix each high finding it confirms, as .sensorloop/LOOPS.md says."
  else
    last="$(tail -n 1 "$state/reviews.log" | cut -c1-7)"
    reason="the latest commit, $short, has no review on record (the last review read $last)"
    todo="Ask the code-reviewer agent to re-review only the open high findings, word for word, on \`git diff $last..HEAD\`. Round $reviews of 3."
  fi
fi

# The same refusal three times in a row goes to the person.
fingerprint="$(printf '%s %s' "$reason" "$head" | sed -E 's/[0-9a-f]{7,40}/#/g' | cksum | cut -d' ' -f1)"
previous="$(cat "$state/review.streak" 2>/dev/null || true)"
count=1
if [ "${previous%% *}" = "$fingerprint" ]; then
  count=$(( ${previous##* } + 1 ))
fi
printf '%s %s\n' "$fingerprint" "$count" > "$state/review.streak"
if [ "$count" -ge 3 ]; then
  rm -f "$state/review.streak"
  jq -cn --arg m "sensorloop: review: $reason, after 3 rounds; over to you." '{systemMessage: $m}'
  exit 0
fi

printf 'sensorloop: review failed (%s). %s\n' "$reason" "$todo" >&2
exit 2
