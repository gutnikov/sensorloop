# The sandbox of the config-validation experiment: the shared invoicer project, with the countries we invoice (their
# currency and VAT rate) in invoicer.config.json, and a JSON Schema for that file that editors read and nothing runs.
# The judge checks the file against the schema with ajv, installed in /opt/judge for the judge only.
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

COPY judge-deps/ /opt/judge/
RUN cd /opt/judge && npm ci --no-audit --no-fund && npm cache clean --force

USER node
COPY --chown=node:node --from=fixtures invoicer/ /work/
COPY --chown=node:node fixture/ /work/
RUN npm ci --no-audit --no-fund && git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-11-01T09:00:00Z GIT_COMMITTER_DATE=2026-11-01T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.5.0: countries in invoicer.config.json, each invoice in its country's currency" \
 && git config user.name Dana && git config user.email dana@invoicer.invalid
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
