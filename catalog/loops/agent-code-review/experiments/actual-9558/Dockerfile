# The sandbox of the actual-9558 experiment: Actual Budget (github.com/actualbudget/actual, MIT) at the commit pull
# request #9558 started from. The runner builds it (packages/experiment); BASE is the base image.
ARG BASE=sensorloop-experiment-base

# --- Shared, word for word, by every Actual experiment (catalog/loops/*/experiments/actual-*), so that their images
# share these layers: Node as Actual's CI sets it up (.nvmrc: v24.22.1), yarn through corepack, and the dependencies of
# one master commit (4ca5c891, 2026-11-14), installed once. Only that commit's manifests enter the image: none of its
# code or history. Electron's binary is not downloaded: no experiment builds the desktop app.
FROM ${BASE} AS actual-manifests
USER node
RUN git init -q /tmp/actual && cd /tmp/actual \
 && git fetch -q --depth 1 https://github.com/actualbudget/actual.git 4ca5c891e342c91193e2ece256bf6df5fe28c646 \
 && git checkout -q FETCH_HEAD && mkdir /tmp/manifests \
 && git ls-files -z -- package.json 'packages/*/package.json' yarn.lock .yarnrc.yml yarn.config.cjs .yarn \
    | xargs -0 cp --parents -t /tmp/manifests

FROM ${BASE}
ARG TARGETARCH
RUN set -eu; \
    case "$TARGETARCH" in \
      arm64) arch=arm64; sum=33c37be234ba8bee041961047b19160f4d7d0f164e8e246f78bdd10feff148b3 ;; \
      amd64) arch=x64;   sum=eb6728e77c576a35162c122c45ccadf224d89ff00abc8dae46cc2897c6002d7c ;; \
      *) echo "unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    curl -fsSL -o /tmp/node.tar.gz "https://nodejs.org/dist/v24.22.1/node-v24.22.1-linux-${arch}.tar.gz"; \
    echo "$sum  /tmp/node.tar.gz" | sha256sum -c -; \
    rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg; rm -rf /opt/yarn-v*; \
    tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 --no-same-owner; rm /tmp/node.tar.gz; \
    corepack enable; node -v
USER node
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY --from=actual-manifests --chown=node:node /tmp/manifests/ /work/
RUN COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack install && yarn --immutable && yarn --version

# --- This experiment: Actual at the commit #9558 started from (4ca5c891, 2026-11-14), with 50 commits of history as a
# contributor's clone has them, and its dependencies installed. No remote, so no later commit is in reach.
RUN cd /work && git init -q -b master \
 && git fetch -q --depth 50 https://github.com/actualbudget/actual.git 4ca5c891e342c91193e2ece256bf6df5fe28c646 \
 && git checkout -q -f -B master FETCH_HEAD && git clean -q -fd && rm -f .git/FETCH_HEAD \
 && yarn --immutable \
 && git config user.name "Sam Rivera" && git config user.email sam@contributor.invalid \
 && test -z "$(git status --porcelain)"
USER root

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
