# The sandbox of the correction-becomes-rule experiment: the shared invoicer project, unchanged. Two sessions run in
# it one after the other (experiment.yaml), so the second session's task, task-2.md, goes to /experiment as well.
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

USER node
COPY --chown=node:node --from=fixtures invoicer/ /work/
RUN npm ci --no-audit --no-fund && git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-11-01T09:00:00Z GIT_COMMITTER_DATE=2026-11-01T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.4.0: summary, aging and csv" \
 && git config user.name Dana && git config user.email dana@invoicer.invalid
USER root

COPY task.md task-2.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
