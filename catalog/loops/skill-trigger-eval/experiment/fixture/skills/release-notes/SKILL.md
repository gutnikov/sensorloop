---
name: release-notes
description: Writes the release notes of a version for the people who use the app, from the commits since the last tag. Use when someone asks for release notes, or for what to tell users or customers about a release.
---

# Release notes

Release notes are for the people who use the app, not for developers: what they can do now, what works better, what
was fixed. They go in `RELEASE_NOTES.md`, newest version first.

1. Find the last tag: `git describe --tags --abbrev=0`. The version is the one the person names; if they name none,
   it is the next one after the last tag (ask which part goes up when the commits do not make it clear).
2. Read the commits since the tag: `git log <tag>..HEAD --no-merges --format='%h %s%n%b'`. Read the pull requests
   they name when a subject is not enough to say what changed for a user.
3. Leave out what users do not see: refactors, tests, CI, dependency bumps with no visible effect.
4. Write the section:

   ```
   ## 2.4.0 (2026-11-20)

   ### New
   - You can export a report as a spreadsheet from its menu.

   ### Improved
   - Search answers in under a second on large accounts.

   ### Fixed
   - Signing in no longer loops back to the login page after a password change.
   ```

   One line per change, in plain words, starting with what the user sees. No commit hashes, no ticket numbers.
5. Show the section to the person before writing it to the file.
