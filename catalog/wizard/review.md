# Review the wizard as one persona

The brief each reviewer agent gets in a round (see README.md). `<round>` is the round's folder, outside the
repository; `<persona>` is a persona's file name without `.yaml`.

You are testing a wizard: at most eight multiple-choice questions about a software project, which recommends the
validation loops a team should set up for its coding agents (checks that catch an agent's mistakes, such as tests,
reviews, gates before risky actions, smoke tests after a deploy). The repository is
`/Users/agutnikov/work/projects/superloops`. The loops come from its catalog; the list of all of them, with a one-line
summary, is `loops.txt` in the round's folder, and each loop's full card is `catalog/loops/<id>/card.md`.

**Do not read anything under `catalog/wizard/`** (it holds the expectations you are tested against), and do not edit
any file in the repository. You judge the wizard from the outside, as its users would.

## 1. Answer as the persona

Your persona is in `<round>/<persona>.who.txt`. You are that developer. Read the questions in `<round>/questions.txt`
and answer each as they would. When the persona does not say, pick what such a developer most likely has, and record
the guess. Skip a question whose "asked only when" does not hold for your earlier answers, and do not pick an option
whose "shown only when" does not hold.

Write the answers as JSON to `<round>/answers/<persona>.json`: each question's id maps to an option's id (a question
that takes one), or to a list of options' ids (pick all that apply).

## 2. See the result

From the repository's folder run `node packages/catalog/src/wizard-cli.js run <round>/answers/<persona>.json`. If it
says the answers do not fit, fix them and run it again.

## 3. Review it twice

First as the persona: would you set these loops up? Is any of them absurd for you, or does a reason not apply to you?
Is it too much to start with? Was a question hard to answer, ambiguous, or did it force an answer that is not true of
you?

Then as an expert in validation loops for coding agents, who knows the whole catalog (read the cards you need): which
loops does this project clearly need that the result lacks? Which in the result do not fit, or are premature? Are the
loops under START WITH the right first steps for this project, in the right order, and those under NEXT the right
next ones? Is a loop under THEN, or under LATER (it needs something the project lacks), in the wrong tier? Is a loop
LEFT OUT that should not be? Is the base set (every project gets it) right for
this project? Does each loop's reason fit this project?

Severity: **high** when the persona would get a materially wrong setup (a missing loop that guards their worst risk,
or a loop that is absurd for them) or could not answer truthfully; **medium** when the result is noticeably worse
than it should be; **low** for wording and polish.

Write the review as JSON to `<round>/reviews/<persona>.json`:

```json
{
  "persona": "<persona>",
  "answers": { "...": "..." },
  "guesses": ["what you assumed that the persona did not say"],
  "hard_questions": [{ "question": "<id>", "severity": "high|medium|low", "problem": "...", "suggestion": "..." }],
  "missing": [{ "loop": "<id>", "severity": "...", "why": "..." }],
  "unfit": [{ "loop": "<id>", "severity": "...", "why": "..." }],
  "wrong_place": [{ "loop": "<id>", "severity": "...", "why": "for example: under then, but it should be a first step" }],
  "wrong_reasons": [{ "loop": "<id>", "severity": "...", "why": "..." }],
  "other": [{ "severity": "...", "note": "..." }],
  "overall": "one paragraph: how well the wizard served this persona"
}
```

Only name loops that exist in `loops.txt`. If the catalog has no loop for a real need, say so under `other`, in one
short entry, at low severity: those gaps are known, and this review is about the wizard.

Reply with at most five lines: the count of high and medium findings, and the most important one.
