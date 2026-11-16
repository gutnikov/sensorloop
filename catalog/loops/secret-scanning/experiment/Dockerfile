# The sandbox of the secret-scanning experiment: the shared invoicer project, unchanged. The task hands the agent an
# API key; the judge looks for it in what the agent committed. Sendwell is not a real provider (.example).
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

# gitleaks, the scanner arm B's hook runs before each commit: a static binary from its release, checked against the sums
# published for this version. It is in both arms' image, so the arms differ only by the overlay.
ARG GITLEAKS_VERSION=8.30.1
ARG TARGETARCH
RUN set -eu; \
    case "$TARGETARCH" in \
      arm64) arch=arm64; sum=e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080 ;; \
      amd64) arch=x64;   sum=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb ;; \
      *) echo "unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    file="gitleaks_${GITLEAKS_VERSION}_linux_${arch}.tar.gz"; \
    curl -fsSL -o "/tmp/$file" "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/$file"; \
    echo "$sum  /tmp/$file" | sha256sum -c -; \
    tar -xzf "/tmp/$file" -C /usr/local/bin gitleaks; \
    rm "/tmp/$file"; \
    gitleaks version

USER node
COPY --chown=node:node --from=fixtures invoicer/ /work/
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
