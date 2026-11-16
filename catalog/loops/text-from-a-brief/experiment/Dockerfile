# The sandbox of the text-from-a-brief experiment: the shared invoicer project released as 0.4.0 (tagged v0.4.0, with
# a CHANGELOG.md written for customers), then eight commits on main since: two features, a bug fix and a new Node
# requirement that customers see; an internal refactor and a CI change they do not; and a feature added and reverted a
# week later. The history is made by fixture/history/make.mjs, one commit per folder. The runner builds it
# (packages/experiment): BASE is the base image; the build contexts are `fixtures` (packages/experiment/fixtures) and
# `plugin` (the plugin's hook scripts).
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

USER node
COPY --chown=node:node --from=fixtures invoicer/ /work/
COPY --chown=node:node fixture/base/ /work/
RUN npm ci --no-audit --no-fund && git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-09-01T09:00:00Z GIT_COMMITTER_DATE=2026-09-01T09:00:00Z \
    git -c user.name="Dana Whitfield" -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.4.0" \
 && GIT_COMMITTER_DATE=2026-09-01T09:00:00Z \
    git -c user.name="Dana Whitfield" -c user.email=dana@invoicer.invalid tag -a v0.4.0 -m "invoicer 0.4.0"
COPY --chown=node:node fixture/history/ /tmp/history/
RUN node /tmp/history/make.mjs /tmp/history /work && rm -rf /tmp/history \
 && git config user.name "Dana Whitfield" && git config user.email dana@invoicer.invalid
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
