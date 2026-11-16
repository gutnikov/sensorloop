# The sandbox of the run-tests-first experiment: the shared invoicer project, then this experiment's commit on top of it,
# which added a test that fails since WELCOME10 ended. The runner builds it (packages/experiment): BASE is the base
# image; the build contexts are `fixtures` (packages/experiment/fixtures) and `plugin` (the plugin's hook scripts).
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

USER node
COPY --chown=node:node --from=fixtures invoicer/ /work/
RUN git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-09-01T09:00:00Z GIT_COMMITTER_DATE=2026-09-01T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.4.0: summary, aging and csv"
COPY --chown=node:node fixture/ /work/
RUN npm ci --no-audit --no-fund && git add -A \
 && GIT_AUTHOR_DATE=2026-10-02T15:20:00Z GIT_COMMITTER_DATE=2026-10-02T15:20:00Z \
    git -c user.name=Sam -c user.email=sam@invoicer.invalid commit -qm "discounts: WELCOME10 ends with the launch campaign, on 31 October"
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
