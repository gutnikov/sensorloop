# The sandbox of the architecture-fitness-functions experiment, the same as shipped-artifact-check's (the same task
# judges both loops): the shared invoicer project, with a package (files: dist) and an ARCHITECTURE.md. The judge builds
# the package and installs it, as the accountant does, and checks that src/report and src/export do no I/O.
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

# dependency-cruiser, which arm B's hooks run on the architecture rules, with the TypeScript it parses .ts files with:
# in a folder of its own, `depcruise` linked into /usr/local/bin, in both arms, so the project's files stay as in arm
# A's pilot and the arms differ only by the overlay. (Not `npm install -g`: a global dependency-cruiser prints a
# warning on every run, which would reach the agent.)
RUN npm install --prefix /opt/depcruise --no-audit --no-fund --no-save dependency-cruiser@18.7.0 typescript@5.9.3 \
 && ln -s /opt/depcruise/node_modules/.bin/depcruise /usr/local/bin/depcruise && npm cache clean --force

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
