# The sandbox of the api-breaking-changes experiment: the shared invoicer project, published as a library too (src/index.ts).
# The judge compiles and runs billing-service's use of it against what the agent leaves.
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

USER node
COPY --chown=node:node --from=fixtures invoicer/ /work/
COPY --chown=node:node fixture/ /work/
RUN npm ci --no-audit --no-fund && git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-11-01T09:00:00Z GIT_COMMITTER_DATE=2026-11-01T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.4.0: summary, aging and csv" \
 && git config user.name Dana && git config user.email dana@invoicer.invalid
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
