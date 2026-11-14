---
title: Validate the configuration
summary: A validator checks every configuration file and profile against its schema, a link check confirms that each URL they name leads to a server, and a smoke start runs the app with each profile.
sensors: [structure-check, smoke-probe]
when: "Structure check: the schema after each edit of the configuration and at each commit; the links on each pull request that changes the configuration, and daily. Smoke and health probe: the smoke start on each pull request that changes the configuration."
failure: A value that breaks the schema, such as a misspelled key or a port given as a string. A URL that is gone or leads to no server. A profile that does not start the app in time, or starts it on values other than its own.
next: The agent fixes the configuration, or the schema when the configuration is right and the schema is behind it, and runs the checks again; a change to the schema goes to a person's review with the pull request. When the cause is outside the project, such as a URL that is gone, or a check still fails after the agent's second fix, it stops and hands a person the failing line.
---

## The loop

1. The agent edits a configuration file or a profile (dev, staging, production).
2. A validator checks every configuration file and every profile against its schema, without starting the app, and
   names the file and the key path of each wrong or missing value.
3. A link check confirms that each URL the configuration names, such as an MCP server's, leads to a server. Without
   credentials, an auth or method error (401, 403, 405) or a server error still shows a server there, and passes;
   only a 404, a 410, or a connection, DNS or TLS failure fails. An empty or templated URL (`${`, `{{`) waits for the
   user's value, and is skipped.
4. The app starts with each profile in turn, with test values for the secrets, answers its readiness check and shows
   a value only that profile sets; then it stops.
5. The report has one line per problem, such as `<file>: <key path>: <message>`, `<file>: <url>: gone (404)` or
   `<profile>: started without its values`. The agent fixes the cause and runs the checks again.

The smoke start shows that the app starts with each profile, not that it works where it is deployed. That takes a
probe of the deployed release, after the deploy.

## Why

A mistake in configuration is not in the code, so the compiler does not see it, and tests that run with one profile
miss the others. The schema catches a wrong or missing value without running anything, and the link check a URL that
leads nowhere. The smoke start catches what neither can: a profile that does not start the app, such as one whose
database URL has a scheme the driver does not support, or that starts it on values other than its own.

## Set up

- **A schema for each configuration.** A JSON Schema for YAML and JSON files, checked with a validator such as
  `check-jsonschema --schemafile config.schema.json config/*.yaml`; or a typed configuration class the app loads at
  start, checked by loading every profile in a test. Every key the app needs is `required`, and
  `additionalProperties: false` makes a misspelled key fail instead of being ignored.
- **The environment counts.** The variables the app reads from the environment are in the schema too, through an
  `.env.example` checked the same way: a missing variable breaks the start as surely as a missing key.
- **A link check that cannot pass a dead host.** It sends a HEAD request that follows redirects. On no answer, a 404
  or a 405, it then sends the request the protocol starts with, such as a JSON-RPC `initialize` for MCP. A refused
  connection fails on its own, not through a status code: a fallback such as `$(curl … || echo 000)` gives `000000`,
  which matches no failure code and passes a dead host.
- **A smoke start with a deadline.** The readiness endpoint is polled every 5 seconds for up to 2 minutes; a timeout
  is red, since a slower start is a problem of its own. Secrets come from test values, so it needs no access to the
  real ones. It then reads a value only that profile sets (its name, the provider, the database host), since an app
  started on defaults or on a fallback provider answers ready too.
- **Wiring.** The validator runs in a hook after each edit under the configuration folder, and as a pre-commit hook.
  The link check runs on each pull request that changes the configuration, and daily for URLs that disappear after
  the merge; a red daily run opens an issue. The smoke start, and the final run of all three, are in CI.
- **Out of the agent's reach.** CI runs the final check, and the schema is reviewed like code, so the agent cannot
  make a wrong value right by loosening it.
