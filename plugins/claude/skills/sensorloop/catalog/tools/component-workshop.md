---
title: Component workshop
summary: A place apart from the app where the project's components and screens, built from its own design system, render on their own at a local address, with data that breaks layouts.
sensors: [human-review, screenshot, browser-run]
layer: project
---

A workshop shows the interface without the rest of the app: no backend, no login, no data to seed. A person sees a
screen before the feature is built, a screenshot compares one component at a time, and an accessibility engine checks
each component in each of its states. The design system is the project's own set of components, layout parts and
tokens (its colours, spacing and type), and the workshop renders them as the app would, with the app's styles and
providers around them. Each state of a component is a story, Storybook's word, rendered alone at its own address.

## Finding it

- **A workshop already set up**: its config folder (`.storybook/`, `.ladle/`), story files beside the components
  (`*.stories.tsx`, `*.story.vue`), and the script in the task file that starts it.
- **Another place for the same job**: a scratchpad route in the app, or a section of screens in the workshop.
- **The design system**: a package in the workspace, a components folder or a library among the dependencies; the
  props in each component's source; and what a screen needs around it, the global stylesheet and the providers the app
  wraps itself in (a theme, translations).
- **CI**: a job that builds the workshop or runs its stories as tests.

Where the project already has a way to show components, use that one. Setting up a workshop where there is none is a
decision for a person: it adds dependencies, files and a command the team carries.

## Using it

- **Data that breaks layouts**: long names, large numbers, missing fields and an empty state, not three tidy rows.
  Shared fake data sits in one file, so every story meets the same awkward cases.
- **One story at a time**: a browser driver opens a story's address, waits for it to settle, and takes the screenshot
  compared with its approved image, so a difference names the component that changed. The same driver can run a short
  interaction on a story (open the menu, type in the field) and check what appears.
- **An accessibility engine on each story**, in each state worth checking. Storybook's accessibility addon runs
  axe-core on each story; with another workshop, the browser tests run the engine on each story's address.
- **Prototypes**: a prototype is a screen composed from the design system to show an idea before the feature is
  built. It imports only the design system, makes no API calls and never ships; a check that refuses any other import
  keeps it from growing into the feature. Open it in a browser and fix what the console shows before a person sees it,
  at its address or in a screenshot. Their answer is the decision on what to build.

Examples: Storybook (React, Vue, Angular, Svelte and others), Ladle (React), Histoire (Vue, Svelte), Lookbook (Ruby on
Rails), Widgetbook (Flutter).
