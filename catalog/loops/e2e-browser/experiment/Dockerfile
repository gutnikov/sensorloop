# The sandbox of the e2e-browser experiment: the shared invoicer-web project, with Chromium for its browser tests.
# The runner builds it (packages/experiment): BASE is the base image; the build contexts are `fixtures`
# (packages/experiment/fixtures) and `plugin` (the plugin's hook scripts).
ARG BASE=sensorloop-experiment-base
FROM ${BASE}

# Chromium's system libraries, and the Playwright library the judge drives the browser with: the version the project
# uses, so both find the same browser.
RUN npx -y playwright@1.64.1 install-deps chromium-headless-shell \
 && npm install -g playwright-core@1.64.1 \
 && rm -rf /var/lib/apt/lists/* /root/.npm /root/.cache

# The project, and Playwright's headless Chromium in node's home (~/.cache/ms-playwright), where the agent's runs, the
# person's CI and the judge all find it. Only the headless shell: Playwright runs headless by default, and Lighthouse
# runs well on it. `chromium` on the PATH is that browser, for Lighthouse CI, as Chrome is on a CI runner.
USER node
COPY --chown=node:node --from=fixtures invoicer-web/ /work/
RUN npm ci --no-audit --no-fund && npx playwright install --only-shell chromium && rm -rf /home/node/.npm \
 && git init -q -b main && git add -A \
 && GIT_AUTHOR_DATE=2026-11-02T09:00:00Z GIT_COMMITTER_DATE=2026-11-02T09:00:00Z \
    git -c user.name=Dana -c user.email=dana@invoicer.invalid commit -qm "invoicer-web 0.3.0: invoices and customers in the browser" \
 && git config user.name Dana && git config user.email dana@invoicer.invalid
USER root
RUN ln -s "$(ls -d /home/node/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux*/chrome-headless-shell | head -1)" \
    /usr/local/bin/chromium && chromium --version

COPY task.md experiment.yaml /experiment/
COPY arms/ /experiment/arms/
COPY --from=plugin . /experiment/arms/B/.sensorloop/hooks/
COPY hidden/ /experiment/hidden/
RUN chmod -R go-rwx /experiment
