#!/usr/bin/env bash
# sensorloop: the architecture rules (loop architecture-fitness-functions). Run by check.sh after each edit, before each
# commit and when the agent ends its turn. Prints each violation with its rule's text, which says where the code goes,
# and exits 1 on any.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 1
failed=0

# The imports: ARCHITECTURE.md's layers, as rules in .dependency-cruiser.cjs.
depcruise src --config .dependency-cruiser.cjs --output-type err-long || failed=1

# The clock: dependency-cruiser sees imports, not calls.
clock="$(grep -rnE 'new Date\([[:space:]]*\)|Date\.now\(' src/report src/export 2>/dev/null)"
if [ -n "$clock" ]; then
  failed=1
  printf '%s\n' "$clock" | sed 's/^/  error report-export-read-no-clock: /'
  echo "  src/report/ and src/export/ read no clock (ARCHITECTURE.md): src/cli.ts reads today's date and passes it in."
fi

exit $failed
