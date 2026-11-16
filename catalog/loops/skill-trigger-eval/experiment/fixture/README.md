# shipit

Release chores for our web apps, as a Claude Code plugin. Its skills load when someone asks Claude for one of these
chores in an app's repository:

| Skill | What it does |
|---|---|
| `release-notes` | Writes the release notes of a version for the app's users, from the commits since the last tag. |
| `version-bump` | Bumps the version (semver, from the commits), updates `package.json` and `CHANGELOG.md`, commits and tags. |

## Install

```
claude --plugin-dir path/to/shipit
```

or add this repository as a marketplace (`/plugin marketplace add <its URL>`) and `/plugin install shipit`.

## Layout

- `.claude-plugin/plugin.json`: the plugin's manifest.
- `skills/<name>/SKILL.md`: one skill each. Claude decides whether to load a skill from its `description` alone, so
  the description says when to use it.
- `evals/`: trigger cases, in the format of `claude plugin eval`: requests that should load a skill (tag `trigger`)
  and requests that should not (tag `no-trigger`).

## Checks

- CI runs `claude plugin validate .` on every pull request.
- The trigger cases call the model, so CI does not run them; we run them by hand:
  `claude plugin eval . --tag trigger --tag no-trigger --ablation none --no-publish`. Each case runs three times;
  the report shows how often the skill loaded.
