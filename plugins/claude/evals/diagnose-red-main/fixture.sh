#!/bin/bash
# The script runs in the empty workspace and cannot read the case's folder, so it writes every file itself.
set -e
# A small Python project with no third-party tools: tests run with unittest, the code is checked by compiling it,
# both behind make. No linter and no CI, on purpose.
mkdir -p src/shop tests
printf '' > src/shop/__init__.py
cat > src/shop/cart.py <<'PY'
def total(prices, discount=0.0):
    """The sum of the prices, less a fractional discount, rounded to cents."""
    if not 0 <= discount < 1:
        raise ValueError("discount must be in [0, 1)")
    return round(sum(prices) * (1 - discount), 2)
PY
cat > tests/test_cart.py <<'PY'
import unittest

from shop.cart import total


class TotalTest(unittest.TestCase):
    def test_sum(self):
        self.assertEqual(total([1.10, 2.20]), 3.30)

    def test_discount(self):
        self.assertEqual(total([10, 10], discount=0.25), 15.0)

    def test_bad_discount(self):
        with self.assertRaises(ValueError):
            total([1], discount=1)


if __name__ == "__main__":
    unittest.main()
PY
printf 'test:\n\tPYTHONPATH=src python3 -m unittest discover -s tests\n\ncheck:\n\tpython3 -m compileall -q src\n\n.PHONY: test check\n' > Makefile
printf '# shop\n\nThe cart of a small shop.\n\n- `make test` runs the tests.\n- `make check` compiles the code.\n' > README.md
printf '__pycache__/\n' > .gitignore
mkdir -p .sensorloop/hooks .claude
cat > .sensorloop/loops.yaml <<'Y'
version: 1
project:
  stack: [python]
  commands:
    test: make test
    typecheck: null
    build: make check
    lint: null
    format: null
  has: []
  limits:
    - Nobody watches the agent while it works.
loops:
  - id: run-tests-first
    status: active
    wiring: Instruction in LOOPS.md.
    proved: 2026-11-01
  - id: type-check-and-build
    status: active
    wiring: Stop hook runs `make check` (.sensorloop/hooks/check.sh build).
    proved: 2026-11-01
Y
cat > .sensorloop/LOOPS.md <<'M'
# Loops in this project

## Commands

| What | Command |
|---|---|
| Tests | `make test` |
| Build | `make check` |

## Before you change anything
Run `make test` before changing anything, and note which tests already fail.

## Before you finish
`make check` runs when you end the turn; a failure keeps you working.
M
printf '# shop\n\n## Loops\n\n@.sensorloop/LOOPS.md\n' > CLAUDE.md
cat > .sensorloop/hooks/check.sh <<'S'
#!/usr/bin/env bash
cat > /dev/null
out="$(bash -c "$2" 2>&1)" || { printf 'sensorloop: %s failed\n%s\n' "$1" "$out" >&2; exit 2; }
S
chmod +x .sensorloop/hooks/check.sh
cat > .claude/settings.json <<'J'
{
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.sensorloop/hooks/check.sh build 'make check'" }] }]
  }
}
J
G="git -c user.name=dev -c user.email=dev@example.invalid"
git init -q && git add -A && $G commit -qm 'shop: the cart, with its loops'
python3 - <<'P'
import re
p = 'src/shop/cart.py'; s = open(p).read()
open(p, 'w').write(s.replace('return round(sum(prices) * (1 - discount), 2)', 'return round(sum(prices) * (1 - discount / 100), 2)'))
P
git add -A && git -c user.name=agent -c user.email=agent@example.invalid commit -qm 'cart: take the discount in percent (#12)'
git checkout -q -- . && python3 - <<'P'
p = 'src/shop/cart.py'; s = open(p).read()
open(p, 'w').write(s.replace('return round(sum(prices) * (1 - discount / 100), 2)', 'return round(sum(prices) * (1 - discount), 2)'))
P
git add -A && $G commit -qm 'fix main: tests were red after #12 (discount in percent)'
printf '\n\ndef with_tax(amount, rate=0.2):\n    return amount * rate\n' >> src/shop/cart.py
cat >> tests/test_cart.py <<'PY'


class TaxTest(unittest.TestCase):
    def test_with_tax(self):
        from shop.cart import with_tax
        self.assertEqual(with_tax(10), 12.0)
PY
git add -A && git -c user.name=agent -c user.email=agent@example.invalid commit -qm 'cart: add tax (#15)'
sed -i.bak 's/return amount \* rate/return round(amount * (1 + rate), 2)/' src/shop/cart.py && rm -f src/shop/cart.py.bak
git add -A && $G commit -qm 'fix main: tests red again after #15'
