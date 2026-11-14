---
title: Write from a brief, review once
summary: For a text a person will decide on, the agent writes a brief in which every fact has a source, and a separate writer turns it into the text. The text is checked against the brief and against a catalogue of plain-language errors, revised once, and handed to a person.
sensors: [llm-reviewer, human-answer, linter]
when: "Whenever the agent writes a text a person will decide on: documentation, a pull request's description, release notes, a message that asks for a decision. The brief is checked before writing and the text once after it; a text written again from a completed brief is checked once too. The revision is checked once more, for invented claims only."
failure: A gap in the brief that has no answer yet; an invented claim, one in the text but not in the brief; a missing fact, one in the brief that the reader needs but the text leaves out; a critical or serious review finding. A lint hit counts only once the review confirms it.
next: "The agent answers the brief's questions from the code and the documents, asks the author the rest before writing, and records as unknown what nobody knows. A review finding that needs a fact the brief lacks goes to the author, and the text is written again from the completed brief, once. Then the agent revises once: it removes invented claims or has the author confirm them, adds the missing facts and fixes the critical and serious findings. It deletes any claim the revision invented, and hands the text to a person, naming the findings it could not fix. The revision is not reviewed again."
---

## The loop

1. The agent writes a brief, the only thing the writer will see. Every fact in it carries its source (a file and line,
   a document, a command and its output, or a person's words), and a fact whose source the agent cannot name stays
   out. The brief has fixed fields:
   - what the text is and where it will appear;
   - the facts, each with its source;
   - the agent's own conclusion, with the facts it rests on;
   - what is not known, and who knows it;
   - the reader, and what they must do after reading;
   - the format, and what to keep word for word (paths, IDs, code, terms).
2. The brief check: a reviewer with a fresh context, one that starts with none of the working session's context, reads
   the brief as the text's reader would. It asks at most five questions: what to do when something fails or a case is
   special, an exact number in place of "about", a term the reader may not know, whom to contact, a contradiction. The
   agent answers what the code and the documents can. The rest go to the author, the person who asked for the text, in
   one message. Each answer goes into the brief with its source. "We don't know" is an answer, and goes in too.
3. A writer gets the brief and nothing else, and writes the text.
4. Two checks read the text, each a reviewer with a fresh context.
   - **The fact check** compares the text with the brief. It lists invented claims, which are in the text but neither
     in the brief nor following directly from it, and missing facts, which are in the brief and needed by the reader
     but absent from the text.
   - **The review** runs the prose linter and decides on every hit, then reads the text against the catalogue of
     plain-language errors, from its purpose down to its words. Each finding gives the error's code, its severity,
     the place quoted word for word, and what the reader loses there. The review names problems; it does not rewrite.
5. A finding that needs a fact the brief does not have, such as "it does not say what to do if the upgrade fails",
   goes to the author as a question. The answer, or "we don't know", goes into the brief. The writer then writes a new
   text from the completed brief, and the two checks of step 4 read it. This return happens once: on the new text,
   such a finding goes to step 6.
6. A writer revises the text once, in a run of its own that gets the brief, the text and the findings, under the
   writer's rule: it writes only what the brief says. It removes
   each invented claim, or keeps it once the author confirms it, and the confirmation goes into the brief. It adds the
   missing facts and fixes the critical and serious findings. It fixes a noticeable or polish finding only where the
   fix is obvious. A finding it cannot fix without a new fact stays as it is, and is named when the text is handed
   over.
7. The fact check runs again on the revision, since a revision can add a claim of its own. The agent deletes any such
   claim itself, without another round.
8. A person reads the text, and publishes it or sends it back.

## Why these sensors

- **The LLM reviewer** reads three times: the brief, for its gaps; the text against the brief, for its facts; the text
  against the catalogue, for its language. A writer reads its own text with what it meant in mind; a reviewer that
  knows only the page reads what is there. The fact check is separate because the review never sees the brief, so it
  cannot tell an invented fact from a real one.
- **The human answer** supplies what only the author knows: what to do when something fails, whom to contact, the
  exact number. A question asked before writing costs one answer. A gap found by review costs a new text.
- **The linter**, here a prose linter, finds by word list, pattern and count what a reviewer would otherwise hunt for:
  passive voice, hedges, wordy phrases, terms the project's glossary bans. It is cheap and gives the same answer on
  every run, but it does not read meaning, so each hit is a candidate the review confirms or drops with a reason.

## Why one revision, then a person

The writer writes only what the brief says, so the brief decides whether the text is true. A writer left with a gap
fills it with something that sounds right. That is why every fact in the brief has a source, every unknown is written
as unknown, and the agent asks the author before writing instead of waiting for review to find the gap.

The loop stops after one review and one revision, for two reasons. A reviewer's findings on the same text vary from run
to run, so a new review of the revised text would mix what is left with findings the first review did not happen to
report. And each revision is one more chance to add an invented claim. What one review and one revision leave is for a
person to judge.

## Where it does not apply

Texts nobody decides on: an acknowledgement that something is done, a link, a status line, a command's output passed
on as it is. The catalogue leaves out spelling and grammar; a spell checker covers those. In a language the catalogue
and the word lists were not built for, the reviewer can still judge the text's purpose, truth and structure, but not
its words.

## Set up

- **The agent's conclusion is a field of its own.** A conclusion the agent does not write down as its own, with its
  reasons, is left out by the writer or flagged as invented.
- **No "about" before a number in the brief.** The writer drops the word, so an estimate becomes an exact number that
  the fact check flags; the revision drops the number, and the fact check flags it as missing. An estimate is written
  as an estimate, with what it is based on ("2 to 3 hours, estimated from the last five runs"), or as unknown.
- **Sums done in the brief.** A calculation or a comparison the text needs is done and checked in the brief: a writer
  left to draw it draws it inexactly.
- **No placeholders in the text**, such as "[to be confirmed]". The review counts the gap anyway, and the text fills
  with markers. A gap is closed by a fact or by "unknown" in the brief.
- **Each step a separate agent run**: the brief check, the writer, the fact check, the review and the revision, the
  checks with tools that only read. The fact check gets the text and the brief. The review gets the text and one line
  of context (the kind of text, the reader, what they must do), never the brief or the writer's reasoning. The
  revision gets the brief, the text and the findings.
- **The catalogue** lists the ways a text fails plain language, from the text's purpose down to its words. Plain
  language is writing its reader understands the first time they read it. Each error has a code, a severity, the signs
  that show it, and the cases where it is not an error, which the review cites to drop a false positive. Severity runs
  from critical (the text misleads or fails its purpose) and serious (its key point does not get through) to
  noticeable and polish. It is built on public plain-language guides, such as the US Federal Plain Language Guidelines
  and the GOV.UK style guide.
- **The fact check is strict.** It sometimes flags a fair conclusion drawn from the brief's facts, and the author
  settles it.
- **High stakes, two reviews.** For an outage report, a price change or anything with legal weight, two reviews read
  the same text, and the revision fixes what both found. It is still one revision.
- **A text changed after the checks is a new text**: the change goes into the brief, and the loop runs again.
- **Unattended runs.** With no one to answer, the open questions go into the brief as unknown.
- **Wiring.** The agent runs the loop itself before it hands the text over: before it opens the pull request with its
  description, posts the message or commits the document. A rule in its instructions names the kinds of text the loop
  covers.
