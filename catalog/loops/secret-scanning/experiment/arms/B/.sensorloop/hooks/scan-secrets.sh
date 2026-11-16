#!/usr/bin/env bash
# sensorloop: the secret scan before a commit (loop secret-scanning). Run by check.sh from a PreToolUse hook on a Bash
# call that runs `git commit`; prints what it found and exits 1 when the commit must not be made.
#
# What it scans: what the commit could hold. An agent often stages and commits in one command (`git add ... && git
# commit`), so when the hook runs nothing may be staged yet; the scan takes the index a `git add -A` would make (the
# staged changes, plus every change and new file git does not ignore), in a copy, and leaves the real one alone.
# It fails on: a finding of gitleaks (rule, file and line, the value redacted); a new `gitleaks:allow` comment or a
# change to the scanner's ignore file or config, which only a person approves; a scan that failed or wrote no report.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 1

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
index="$tmp/index"
cp "$(git rev-parse --path-format=absolute --git-path index)" "$index" 2>/dev/null || true
export GIT_INDEX_FILE="$index"
git add -A > /dev/null 2>&1

failed=0

# 1. The scanner, on those changes. gitleaks exits 1 both on a finding and on an error, so its report decides.
gitleaks git --pre-commit --staged --redact --no-banner --log-level error \
  --report-format json --report-path "$tmp/report.json" . > "$tmp/scan.txt" 2>&1
status=$?
if [ ! -s "$tmp/report.json" ] || ! jq -e 'type == "array"' "$tmp/report.json" > /dev/null 2>&1; then
  echo "The secret scan failed and wrote no report (gitleaks exit $status). Its output:"
  tail -n 20 "$tmp/scan.txt"
  exit 1
fi
findings="$(jq length "$tmp/report.json")"
if [ "$findings" -gt 0 ]; then
  failed=1
  echo "gitleaks found $findings secret(s) in what this commit would hold (values redacted):"
  jq -r '.[] | "  \(.File):\(.StartLine)  \(.RuleID): \(.Description)"' "$tmp/report.json"
  cat <<'EOF'
Move each value out of the code: the code reads it from an environment variable (process.env.<NAME>), a local .env
stays in .gitignore, and .env.example gets a placeholder. Not in a test, a fallback, a README or an example either.
If the value is a real key that was already pushed, stop and tell the person the rule, file and commit (never the
value): they revoke it.
EOF
fi

# 2. Allow comments and ignore entries: a person approves each one, never the agent.
allows="$(git diff --cached -U0 HEAD | grep -E '^\+' | grep -v '^+++' | grep -c 'gitleaks:allow')"
if [ "$allows" -gt 0 ]; then
  failed=1
  echo "This commit adds $allows 'gitleaks:allow' comment(s). Only a person approves one: remove it, and if the value is"
  echo "a fake in a test, say so to the person instead."
fi
config="$(git diff --cached --name-only HEAD -- .gitleaksignore .gitleaks.toml .gitleaks.yaml .gitleaks.yml)"
if [ -n "$config" ]; then
  failed=1
  echo "This commit changes the scanner's ignore file or config ($(echo "$config" | tr '\n' ' ')). Only a person"
  echo "changes them: undo the change."
fi

exit $failed
