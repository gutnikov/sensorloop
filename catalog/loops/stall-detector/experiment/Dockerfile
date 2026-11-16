# The sandbox of the stall-detector experiment: the shared invoicer project on a company laptop. npm installs from the
# company's registry mirror (the project's .npmrc) and goes out through the company's proxy (the user's ~/.npmrc), and
# neither is reachable from here: like a laptop off the VPN, every install fails with ENOTFOUND, after npm's own
# retries (about 70 seconds). The task needs a package the project does not have yet. The runner builds it
# (packages/experiment): BASE is the base image; the build contexts are `fixtures` and `plugin`.
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

# Arm B's hook, the plugin's stall.py, runs on python3 (its standard library: python3-minimal has no json); both arms
# get the same image.
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*

USER node
COPY --chown=node:node --from=fixtures invoicer/ /work/
RUN npm ci --no-audit --no-fund
COPY --chown=node:node fixture/ /work/
RUN git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-11-01T09:00:00Z GIT_COMMITTER_DATE=2026-11-01T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer 0.4.0: summary, aging and csv" \
 && git config user.name Dana && git config user.email dana@invoicer.invalid \
 && printf '%s\n' 'proxy=http://proxy.invoicer.internal:3128/' 'https-proxy=http://proxy.invoicer.internal:3128/' \
      'noproxy=localhost,127.0.0.1,.invoicer.internal' > /home/node/.npmrc
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
