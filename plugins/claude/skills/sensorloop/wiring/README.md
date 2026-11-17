# Wiring pages

The loops most projects get have a page here, each with what it adds to the project, the text it puts in `LOOPS.md`,
and how to prove it fires. The card behind each is `../catalog/loops/<id>.md`; read it for the reasons.

Every other loop is wired from its card: its "The loop" and "Set up", its `when`, `failure` and `next`, built with the
tools found in the project. The same scripts serve it where they fit: `check.sh` runs any command as a hook. Prove it
the same way: make it fail once on purpose, see its signal, undo the break
([../procedures/setup.md](../procedures/setup.md) step 5).

| Loop | Page | What it adds |
|---|---|---|
| Run the tests first | [run-tests-first.md](run-tests-first.md) | `LOOPS.md` |
| Red, then green | [red-green-tdd.md](red-green-tdd.md) | `LOOPS.md` |
| Type check and build | [type-check-and-build.md](type-check-and-build.md) | hooks after edits and before the turn ends |
| Lint with fix instructions | [lint-with-fix-instructions.md](lint-with-fix-instructions.md) | a hook before each commit |
| Ask before the irreversible | [risky-action-gates.md](risky-action-gates.md) | `ask` permissions |
| Stall detector | [stall-detector.md](stall-detector.md) | hooks after each tool call and on each prompt |

The scripts in [scripts/](scripts/) are copied to `.sensorloop/hooks/` in the project and made executable
(`chmod +x`). Hook commands call them through `"$CLAUDE_PROJECT_DIR"`, so they work from any directory.

`check.sh` runs one command. On a failure it gives the agent the end of the output and exits 2: after an edit the
agent sees it at once, before a commit the commit is refused, before the turn ends the turn goes on. The same failure
three times in a row at the end of a turn goes to the person instead.
