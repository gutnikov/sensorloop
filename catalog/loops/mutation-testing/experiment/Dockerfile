# The sandbox of the mutation-testing experiment: the shared invoicer project, with @vitest/coverage-v8 (the version of
# its vitest) in its devDependencies, in both arms: arm B's hook and the judge measure the coverage of the changed lines
# with it. The runner builds it (packages/experiment): BASE is the base image; the build contexts are `fixtures`
# (packages/experiment/fixtures) and `plugin` (the plugin's hook scripts).
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

USER node
COPY --chown=node:node --from=fixtures invoicer/ /work/
RUN npm ci --no-audit --no-fund && npm install --save-dev --save-exact --no-audit --no-fund @vitest/coverage-v8@3.2.7 \
 && git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-11-01T09:00:00Z GIT_COMMITTER_DATE=2026-11-01T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.4.0: summary, aging and csv" \
 && git config user.name Dana && git config user.email dana@invoicer.invalid
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
