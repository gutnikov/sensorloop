# The sandbox of the observe-and-interrupt experiment: invoicer-cloud, a small project of its own (an HTTP API over
# Postgres, migrations run by dbmate on every deploy, tests on PGlite). Its history: 1.11.0, then the release of
# Tuesday 10 November (1.12.0) that added the billing email and its migration. The judge applies the migrations with
# PGlite, installed in /opt/judge for the judge only.
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

COPY judge-deps/ /opt/judge/
RUN cd /opt/judge && npm ci --no-audit --no-fund && npm cache clean --force

USER node
COPY --chown=node:node fixture/ /work/
COPY --chown=node:node history/1.11.0/ /work/
RUN npm ci --no-audit --no-fund && rm db/migrations/20261110140000_add_customer_billing_email.sql \
 && git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-10-20T09:00:00Z GIT_COMMITTER_DATE=2026-10-20T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer-cloud 1.11.0" && git tag v1.11.0
COPY --chown=node:node fixture/ /work/
RUN git add -A \
 && GIT_AUTHOR_DATE=2026-11-10T13:40:00Z GIT_COMMITTER_DATE=2026-11-10T14:05:00Z \
    git -c user.name=Sam -c user.email=sam@invoicer.invalid commit -qm "customers: a billing email, where their invoices go (#58)" \
 && git tag v1.12.0 \
 && git config user.name Dana && git config user.email dana@invoicer.invalid
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
