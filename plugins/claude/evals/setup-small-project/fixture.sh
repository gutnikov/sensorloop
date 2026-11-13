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
git init -q && git add -A && git -c user.name=dev -c user.email=dev@example.invalid commit -qm 'shop: the cart'
