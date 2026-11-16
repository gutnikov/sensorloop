# The sandbox of the skill-trigger-eval experiment: shipit, a Claude Code plugin of its own (fixture/) with two skills
# and their trigger cases. The runner builds it (packages/experiment): BASE is the base image; the build contexts are
# `fixtures` and `plugin`.
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

USER node
COPY --chown=node:node fixture/ /work/
RUN git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-10-28T09:00:00Z GIT_COMMITTER_DATE=2026-10-28T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@acme.invalid commit -qm "shipit 1.2.0: release-notes and version-bump" \
 && git config user.name Dana && git config user.email dana@acme.invalid
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
