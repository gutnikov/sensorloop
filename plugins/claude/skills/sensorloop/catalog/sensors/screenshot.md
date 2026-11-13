---
title: Screenshot and recording
type: computational
summary: Captures what the interface looks like, as an image or a video, for a comparison or as evidence.
signal: A pixel difference over the tolerance against an approved image, or a frame for a model or a person to judge.
---

This sensor captures what the interface looks like, as an image or a video, to compare with an approved image or to
hand to a model or a person as evidence. Loops read it because a broken layout is plain in a picture and hard to see
anywhere else.

## What it sees

What the screen showed at the moment of capture, in pixels. The capture is deterministic; the judgement is separate,
and can be a pixel diff, a model or a person. A diff sees that something changed, not whether the change is wrong, and
a picture shows nothing of the states it was not taken in.

## Reading the signal

- **Within tolerance**: the capture matches the approved image closely enough.
- **Pixel difference over the tolerance**: the screen changed. It is a regression, or an intended change whose
  approved image must be updated on purpose.
- **A frame to judge**: no comparison; a model or a person judges the capture, and their verdict is the signal.

Many differences come from the capture, not the work: a screen caught before it settled, a clock, an animation, a font
that renders differently on another machine. Let the screen settle before capturing, and mask the regions that change
on their own.
