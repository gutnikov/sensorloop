# The sandbox of the type-check-and-build experiment: the shared base (Claude Code, the recorder, the driver) with this
# experiment's project in /work and its own files in /experiment, where the agent cannot read them.
# The runner builds it (packages/experiment): BASE is the base image, and the build context `plugin` is the plugin's
# hook scripts (plugins/claude/skills/sensorloop/wiring/scripts).
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

# The project: its dependencies installed, and its history, one commit with a fixed date so its hash never changes.
COPY --chown=node:node fixture/ /work/
USER node
RUN npm ci --no-audit --no-fund \
 && git init -q -b main \
 && git add -A \
 && GIT_AUTHOR_DATE=2026-11-01T09:00:00Z GIT_COMMITTER_DATE=2026-11-01T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.4.0: summary, aging and csv"
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
