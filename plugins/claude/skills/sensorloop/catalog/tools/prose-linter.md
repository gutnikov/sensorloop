---
title: Prose linter
summary: Finds the places in prose that may break plain-language rules or the project's glossary, by word list, pattern and count, as candidates for a reader to confirm.
sensors: [linter]
layer: project
---

Plain language is writing its reader understands the first time they read it. Some departures from it leave a mark a
program can find: a hedge from a list, "was" before a past participle, a sentence past a word count, a term the
glossary bans. A prose linter finds those marks cheaply and the same way on every run, so a reviewer or a person spends
attention on judging them rather than hunting for them. It does not read meaning: "very" is a hedge in one sentence and
part of a quotation in the next.

## Finding it

1. **The config files**: `.vale.ini` and the styles directory it names, `.textlintrc` or `.textlintrc.json`,
   `proselint.json`.
2. **CI and the task file**: a job or a script that lints the documentation.
3. **The glossary**: the terms to use and the terms to avoid, kept as a Vale vocabulary (`accept.txt` and
   `reject.txt`), a terminology rule's list of terms, or a glossary page in the docs.

When the project has none, a reviewer does the same pass by reading, and adding a prose linter is a decision for a
person.

## Using it

- **Hits are candidates, not verdicts.** A reviewer or a person checks each against its meaning, and keeps it or drops
  it with a reason. A passive that hides who is responsible is a finding; a passive where the actor does not matter is
  not.
- **A rule for each kind of mark**: a word list for hedges, intensifiers and buzzwords; a pattern for passive voice
  and wordy phrases such as "in order to"; a count for long sentences and long paragraphs; a preferred term in place
  of a banned one. In Vale these are the `existence`, `occurrence` and `substitution` rule types.
- **A count marks a sentence to read, not a limit.** The GOV.UK style guide asks writers to check sentences of more
  than 25 words; such a sentence is not wrong because of its length.
- **Only a rule that cannot be wrong fails the run**, such as a term the glossary bans. Style hints stay warnings that
  a reader reviews. Vale exits with 1 only on alerts of level `error`; textlint exits with 1 on any error.
- **Code is not prose**: Vale skips code blocks and inline code in Markdown by default, so commands and identifiers
  are not judged as sentences.
- **Output a reviewer can read**: `vale --output=JSON`, `textlint --format json` or
  `proselint check --output-format json`, each hit with its file, line, rule and the words it matched.
- **Word lists belong to one language.** A list built for English finds nothing in another language.

Examples: Vale (with styles such as write-good, proselint, Microsoft and Google), textlint (JavaScript, with rules such
as textlint-rule-terminology), proselint (Python).
