@docs/metamodel.md

# This repository

The catalog of sensors, tools and loops, the plugins built from it, and the site at sensorloop.dev.

- `catalog/`: the cards, the only home of their content. `sensors/<id>.md`, `tools/<id>.md`, `loops/<id>/card.md`
  (a loop's folder will also hold its scripts). Front matter is checked against `catalog/schema/`.
- A card's illustration sits beside it, with its name and an image extension (`sensors/<id>.svg`,
  `loops/<id>/card.png`); the site shows it to the right of the card. No front matter field names it.
- Cards are written for any project, whatever its stack. A tool tied to a language is described as a role (the
  project's test command, found in the project), with products such as pytest or Jest only as examples from several
  stacks.
- A relation is written once, on the more specific card: a tool lists the sensors it builds, a loop the sensors it
  reads. A sensor's tools and loops are computed, never written on its card.
- `packages/catalog`: the only code that parses cards. The site and the plugin builders import it.
- `docs/metamodel.md`: the metamodel, imported above and rendered on the home page.
- `site/`: renders `docs/` and the catalog. It holds no content of its own.
- `plugins/claude/`: the Claude Code plugin `sensorloop`, installed from the marketplace in `.claude-plugin/`. Its
  skill (`skills/sensorloop/`) keeps a project's loops; `procedures/` and `wiring/` are written by hand, `catalog/` is
  generated from `catalog/` by `npm run build:plugin` and committed (CI fails when it is out of date). The skill wires
  itself only the loops in `wiring/`; the rest it proposes. Its evals are in `plugins/claude/evals/`.

```bash
npm ci
npm run check     # the catalog against its schemas and references, and the loader's tests
npm run dev       # the site at http://localhost:4321, reloading on changes to catalog/ and docs/
npm run build     # the site into site/dist
npm run build:plugin                       # the catalog into the plugin's skill; commit the result
claude plugin validate plugins/claude      # the plugin; `claude plugin validate .` for the marketplace
claude plugin eval plugins/claude --tag trigger --tag no-trigger   # whether the skill loads when it should (costs model calls)
claude plugin eval plugins/claude --scaffold --allow-tools Bash Write Edit Agent   # every case, fixtures included
```

Deploy (manual): `npm run build && cd site && npx wrangler@4 deploy`. The account is in `site/wrangler.jsonc`.
