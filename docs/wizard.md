# Find your loops

Eight questions about your project, and the loops it needs: the base that every project gets, the few to start with, and the rest in the order to add them.

## How it decides

Every answer adds the loops it calls for, each with its reason, and gives them weight. What defines how the work runs, such as agents left alone overnight, weighs most; then a risk you name; then what you build; then the rest. The heaviest loops are the ones to start with. A loop that needs something your project does not have yet, such as a staging environment or an error tracker, waits under "later" with what it needs, and one you ruled out, such as a check that calls a model, is left out with the reason.

The base is what every project gets, whatever its answers: the agent stops before an action that cannot be undone, runs the tests before and after its change, starts a change in behaviour with a failing test, keeps the build and the linter clean, keeps keys out of the history, and turns each correction you make into a rule. Most of it is a line in the agent's instructions or a hook, and the [plugin](/get-started/) sets it up for you.

The questions and the rules are one file, [`catalog/wizard/tree.yaml`](https://github.com/gutnikov/sensorloop/blob/main/catalog/wizard/tree.yaml). Each change to it is tried on eighteen projects, from a solo SaaS on a laptop to a bank, a game on Steam and a fleet of agents working overnight, and a check fails when one of them loses a loop it must have.
