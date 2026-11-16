---
name: version-bump
description: Bumps the app's version for a release (major, minor or patch, from the commits since the last tag), updates package.json and CHANGELOG.md, commits and tags. Use when someone asks to bump the version, cut a release or tag a version.
---

# Version bump

Our apps follow semantic versioning, and the tag is the release: `v<version>` on the commit that sets it.

1. Make sure the work tree is clean and you are on `main`, up to date with the remote. If not, stop and say why.
2. Find the last tag: `git describe --tags --abbrev=0`.
3. Choose the bump from the commits since the tag (`git log <tag>..HEAD --format=%s`), unless the person named it:
   - a commit marked `!` or with `BREAKING CHANGE` in its body: major;
   - any `feat:` commit: minor;
   - otherwise: patch.
4. `npm version <major|minor|patch> --no-git-tag-version` updates `package.json` and `package-lock.json`.
5. In `CHANGELOG.md`, rename `## [Unreleased]` to `## [<version>] - <today, YYYY-MM-DD>` and add a new empty
   `## [Unreleased]` above it.
6. Commit as `release: v<version>` and tag it: `git tag -a v<version> -m v<version>`.
7. Do not push. Tell the person the version and the command to push: `git push --follow-tags`.
