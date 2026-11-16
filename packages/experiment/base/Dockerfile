# The base of every experiment's sandbox: the same Claude Code, the same recording tools, a user with an empty home.
# An experiment's own Dockerfile starts FROM this image and adds its project's stack and its fixture.
#
#   docker build -t sensorloop-experiment-base packages/experiment/base
#
# Everything is pinned, so two runs a month apart differ only in what the experiment changes.
FROM node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee

ARG CLAUDE_CODE_VERSION=2.1.325
ARG ASCIINEMA_VERSION=3.2.1
ARG TARGETARCH

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git jq procps tmux util-linux locales \
 && sed -i 's/# en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen && locale-gen \
 && rm -rf /var/lib/apt/lists/*

# asciinema 3: a static binary from its release, checked against the sums of the files published for this version.
RUN set -eu; \
    case "$TARGETARCH" in \
      arm64) arch=aarch64; sum=b516a6d896844c0ffbc96e0a55afe4cbcc79216abde0fc64fdda4e39bee421ea ;; \
      amd64) arch=x86_64;  sum=1b405bbda565b33c3c4718de67fedc3535580603c0694b1ff3fb04f363430a20 ;; \
      *) echo "unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    curl -fsSL -o /usr/local/bin/asciinema \
      "https://github.com/asciinema/asciinema/releases/download/v${ASCIINEMA_VERSION}/asciinema-${arch}-unknown-linux-gnu"; \
    echo "$sum  /usr/local/bin/asciinema" | sha256sum -c -; \
    chmod +x /usr/local/bin/asciinema

RUN npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" && npm cache clean --force

ENV LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    TERM=xterm-256color \
    TZ=UTC \
    DISABLE_AUTOUPDATER=1 \
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
    CLAUDE_CODE_VERSION=${CLAUDE_CODE_VERSION}

# The agent runs as `node` (Claude Code refuses to skip permissions as root). Its home holds only what makes the
# first screen the prompt: no user CLAUDE.md, memory, plugins, MCP servers or settings of the host's.
COPY --chown=node:node home/ /home/node/
# The driver runs as root and keeps the experiment's files where the agent cannot read them.
COPY driver/ /opt/experiment/driver/
RUN mkdir -p /work /experiment /out && chown node:node /work && chmod 700 /experiment

WORKDIR /work
ENTRYPOINT ["node", "/opt/experiment/driver/session.mjs"]
