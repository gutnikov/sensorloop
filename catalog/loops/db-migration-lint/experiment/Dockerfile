# The sandbox of the db-migration-lint experiment: its own small project, the hosted invoicer's database migrations
# (dbmate, SQL). No database runs here: the judge reads the migrations the agent wrote.
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

USER node
COPY --chown=node:node fixture/ /work/
RUN git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-11-01T09:00:00Z GIT_COMMITTER_DATE=2026-11-01T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer-cloud 1.12.0" \
 && git config user.name Dana && git config user.email dana@invoicer.invalid
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
