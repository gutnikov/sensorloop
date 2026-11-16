#!/bin/bash
# The script runs in the empty workspace and cannot read the case's folder, so it writes every file itself.
set -e
# A small Python project whose loops were set up a month ago after an interview: the registry records the person's
# limits (watched in a session, no model calls) and wants (pushes wait for them; a wrong cart total is what hurts).
# The loops are an instruction and a permission rule, so no hook scripts are needed.
mkdir -p src/shop tests .sensorloop .claude
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


if __name__ == "__main__":
    unittest.main()
PY
printf 'test:\n\tPYTHONPATH=src python3 -m unittest discover -s tests\n\ncheck:\n\tpython3 -m compileall -q src\n\n.PHONY: test check\n' > Makefile
printf '# shop\n\nThe cart of a small shop.\n\n- `make test` runs the tests.\n- `make check` compiles the code.\n' > README.md
cat > .sensorloop/loops.yaml <<'YAML'
# Kept by the sensorloop skill. Edit it by hand or ask the agent; then ask the agent to rewrite LOOPS.md.
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
    - I watch the agent in a session; it never runs alone.
    - No model calls besides the coding agent itself.
  wants:
    - Pushes wait for me.
    - A wrong total in the cart is what would hurt most; the cart is the product.
  interviewed: 2026-10-02
loops:
  - id: run-tests-first
    status: active
    wiring: Instruction in LOOPS.md; `make test` takes under a second.
    proved: 2026-10-02
  - id: risky-action-gates
    status: active
    wiring: "`ask` rule in .claude/settings.json: git push."
    proved: 2026-10-02
YAML
cat > .sensorloop/LOOPS.md <<'MD'
# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `make test` |
| Compile | `make check` |

## Before you change anything

Run `make test` and note what already fails; a test that passed and now fails is yours to fix.

## Ask a person first

`git push`.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/` or `.claude/settings.json` to get past a loop.
MD
printf '{\n  "permissions": {\n    "ask": ["Bash(git push:*)"]\n  }\n}\n' > .claude/settings.json
printf '# shop\n\n## Loops\n\n@.sensorloop/LOOPS.md\n' > CLAUDE.md
printf '__pycache__/\n.sensorloop/state/\n' > .gitignore
git init -q && git add -A && git -c user.name=dev -c user.email=dev@example.invalid commit -qm 'shop: the cart, and its loops'
