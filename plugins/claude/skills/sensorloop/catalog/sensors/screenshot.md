---
title: Screenshot and recording
type: computational
summary: Captures what the interface looks like, as an image or a video, for a comparison or as evidence.
signal: A pixel difference over the tolerance against an approved image, or a capture for a model or a person to judge.
---

Loops read this sensor because a broken layout is plain in a picture and hard to see anywhere else. The capture is
compared with an approved image, or handed to a model or a person as evidence.

## What it sees

What the screen showed at the moment of capture, in pixels. Taking the capture and judging it are separate steps: the
judge can be a pixel diff, a model or a person. A diff sees that something changed, not whether the change is wrong,
and a capture shows nothing of the states it was not taken in.

## Reading the signal

- **Within tolerance**: the capture matches the approved image closely enough.
- **Pixel difference over the tolerance**: the screen changed. It is a regression, an intended change, or noise from
  the capture itself (see below). An intended change updates the approved image in the same change, where a reviewer
  sees the new image; updating it only to make the check pass hides a regression.
- **A capture to judge**: no comparison here. The capture goes to a model or a person, and the verdict is theirs.

Many differences come from the capture, not the work: a screen caught before it settled, a clock, an animation, a font
that renders differently on another machine. Let the screen settle before capturing, and mask the regions that change
on their own.
