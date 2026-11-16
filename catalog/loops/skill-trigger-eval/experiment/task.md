Please implement this issue.

#14 A skill for changelog entries

Every pull request in our apps adds a line to CHANGELOG.md under `## [Unreleased]`, in the Keep a Changelog section it belongs to (Added, Changed, Deprecated, Removed, Fixed, Security). When someone asks Claude to put a change in the changelog, it does it its own way: a new heading with today's date, a paragraph, sometimes a version number. Add a skill to shipit that writes the entry the way we keep it: one line under Unreleased, in the right section, written for the people who read the changelog.
