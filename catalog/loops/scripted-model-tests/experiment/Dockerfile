# The sandbox of the scripted-model-tests experiment: the shared invoicer-assist project (invoicer, plus `invoicer
# categorize`, which asks a model for each line item's category; its tests script the model). The runner builds it
# (packages/experiment): BASE is the base image; the build contexts are `fixtures` and `plugin`.
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

USER node
COPY --chown=node:node --from=fixtures invoicer-assist/ /work/
RUN npm ci --no-audit --no-fund && git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-10-20T09:00:00Z GIT_COMMITTER_DATE=2026-10-20T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.5.0: categorize, with its eval set" \
 && git config user.name Dana && git config user.email dana@invoicer.invalid
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
