# The sandbox of the agent-ci-hardening experiment: the shared invoicer project, unchanged; it has a CI workflow and no
# agent in CI. The judge reads the workflow the agent adds, with a YAML parser installed beside it in /experiment,
# where the agent cannot see it. The runner builds it (packages/experiment): BASE is the base image; the build contexts
# are `fixtures` (packages/experiment/fixtures) and `plugin` (the plugin's hook scripts).
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

# The project's devDependencies get `yaml` in both arms: arm B's hook (.sensorloop/hooks/agent-ci.mjs) parses the
# workflows with it, as a team's own check script would. The arms differ only by the overlay.
USER node
COPY --chown=node:node --from=fixtures invoicer/ /work/
RUN npm ci --no-audit --no-fund && npm install --save-dev --save-exact --no-audit --no-fund yaml@2.9.1 \
 && git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-11-01T09:00:00Z GIT_COMMITTER_DATE=2026-11-01T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.4.0: summary, aging and csv" \
 && git config user.name Dana && git config user.email dana@invoicer.invalid
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN cd /experiment/hidden && npm ci --no-audit --no-fund --omit=dev
RUN chmod -R go-rwx /experiment
