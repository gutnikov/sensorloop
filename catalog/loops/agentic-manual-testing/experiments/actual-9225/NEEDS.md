# What this experiment needs from the harness

Shared by the Actual experiments (packages/experiment/actual/SELECTION.md); measured on 2026-11-15 in a container of
this image with the runner's limits (2 CPUs, 3 GB).

1. **oxlint does not run on this Docker host.** Actual's `yarn lint` is `oxfmt --check . && oxlint --type-aware
   --quiet`. oxlint 1.88 (with the project's JS plugins) panics at start, with or without `--type-aware` and without the
   memory limit: `panicked at crates/oxc_allocator/src/pool/fixed_size.rs:112:67`, its fixed-size allocator failing to
   reserve memory (the Docker VM has 6 GB). So `ci` runs only `oxfmt --check .`. On a host where it runs, add
   `yarn oxlint --type-aware --quiet` to `ci`, and say so in the results.
2. **A CI step may take at most 5 minutes** (`runCi`, `timeout: 300_000`). The whole node suite of `@actual-app/core`
   took 2 min 55 s to 4 min 40 s here (282 s once while another image was building), so `ci` runs only the folders the
   change touches. A per-experiment step limit (say `ci_step_minutes`) would let it run the workspace's whole suite, as
   Actual's CI does.
3. **The first hand-over's copy is large.** When the work changes after the first "done", `restoreFirst` copies `/work`
   with `cp -a`: 2.0 GB here (node_modules 1.5 GB, the yarn cache 0.3 GB), 86 s. It fits (the container's disk had
   39 GB free), but a copy of the tracked and new files that links `node_modules` and `.yarn/cache` would be faster.
4. The image installs Node 24.22.1 (Actual's `.nvmrc`) over the base's Node 22 and enables corepack (yarn 4.17.1, the
   project's `yarnPath`). Claude Code is a native binary, so it does not run on that Node. Electron's binary is not
   downloaded (`ELECTRON_SKIP_BINARY_DOWNLOAD`).
