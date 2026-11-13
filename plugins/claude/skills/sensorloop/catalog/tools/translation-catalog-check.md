---
title: Translation catalog check
summary: "Checks the project's messages and translations: hard-coded strings, missing keys, placeholders that differ between locales."
sensors: [structure-check, linter]
layer: project
---

This tool checks the project's messages and their translations: strings written straight into the code, keys missing
from a locale, placeholders that differ between locales. How the project stores its messages decides which checks
apply, and that is found in the project.

## Finding it

Look for the message catalogs (a `locales/` directory, `.po` and `.pot` files, JSON or YAML catalogs per language),
for the i18n library in the dependencies, and in the task file or CI for an extract or check step.

## Using it

- **Extract and compare**: the messages extracted from the code (`formatjs extract`, `i18next-parser`, `xgettext`) are
  compared with each locale's catalog, so missing and unused keys show.
- **Check the placeholders**: `msgfmt --check` for gettext catalogs; for ICU messages, each locale's text parsed with
  the library the app uses.
- **Find hard-coded strings** with a lint rule, such as `no-literal-string` from eslint-plugin-i18next.
- **Build a pseudo-locale**: accented, lengthened text shows strings that overflow their space or were never
  translated.

Examples: FormatJS (JavaScript), i18next tooling (JavaScript), gettext's `msgfmt --check`, Android Lint's
`MissingTranslation` check (Android).
