---
title: Triage what comes in
summary: Each incoming error, alert, bot's pull request, user's message or ticket is merged with an open item on the same problem, or sorted as a fix, a new feature, maintenance or a question for a person, and a person decides what the judge cannot.
sensors: [llm-judge, human-answer]
when: As each item arrives and before any work starts on it, from a webhook or a scheduled job over the error tracker, the alerts and the issue tracker. A person is asked when the judge cannot decide, and before a one-way door.
failure: An item that duplicates an open one, cannot be worked as it stands, or came with a kind that triage changes, such as a ticket typed as a bug. Later, a kind that proves wrong, such as a maintenance item that changes behaviour, or a fix whose reproduction turns out to be a new requirement.
next: A separate job writes the judge's answer as labels and a comment, only when every rule in code holds, and closes a duplicate only after a window for a veto. An ambiguous item, a one-way door, or an item whose triage fails twice goes to a person with the options and a recommended kind. Until the judge is calibrated on items a person sorted, it only proposes.
---

## The loop

1. An item arrives: an error from the error tracker, an alert, a pull request from a dependency bot, a message from a
   user, a ticket. Code checks it first: a required field left empty, or a bug on an old version, needs information.
2. The judge reads it with the open items. Spam and empty items are not sorted, and a prompt injection is spam. One
   short of information gets a comment that names what is missing and when it closes unanswered, and waits.
3. Duplicates first: an item on the same problem as an open one joins it.
4. The rest is sorted by the work it needs, by rules where they can and by the judge otherwise:
   - **a fix**: the product does not do what it was specified to do, or what it did before;
   - **a new feature**: the product should do something new or different;
   - **maintenance**: the behaviour stays, and a dependency, the structure, the speed or the size changes;
   - **a question for a person**: it is not known yet whether to do it, or how.
5. The judge returns the kind, the reason and the open item it duplicates, if any, or says that the item is
   ambiguous. It posts, labels and closes nothing, and until it is calibrated on items a person sorted, it only
   proposes and a person decides.
6. An ambiguous item goes to a person, with the options and a recommended kind. So does a one-way door, however clear:
   a public API, a default users build on, a removal, a persisted format.
7. A kind can prove wrong later: a maintenance item whose check finds a changed behaviour, or a fix whose reproduction
   turns out to be a new requirement. Each is logged with the item, and becomes an eval case for the judge.

## Why

The same complaint can be a bug, an idea or a wish for something faster, and the kind decides how the work is
checked: a fix against a reproduction that fails, a feature against a spec a person approves, maintenance against the
behaviour as it is. So a change of behaviour sorted as maintenance reaches users without a person approving it.
Merging duplicates first keeps one problem from being worked on twice.

## Set up

- **Intake asks what triage needs.** Blank issues are off, and the bug form asks whether it is a regression, the
  version, the last one that worked and the product's report on its environment. A script, not the model, compares
  the reported version with the current release.
- **A duplicate is the same problem**: the same error fingerprint or dependency, the same symptom with the same likely
  cause, or a pull request that fixes this exact item; a shared component or error message is not enough. The search
  tries several phrasings over open and closed items, the code and a record of rejected requests, and reads each
  candidate's whole thread. With low confidence the judge returns no match, and a duplicate points at the oldest item.
- **The judge proposes; a separate job writes.** The judge reads text strangers wrote, so it holds no write token,
  and that text never reaches a shell command. The writer applies the answer only to the items it was given, only
  with labels that exist, and the judge's text only inside a fixed template. A label that grants rights downstream,
  such as the top priority, goes to a person. A broken plan goes back once; broken again, nothing is written.
- **Labels, not closes.** Closing a duplicate leaves a window for a veto: a comment says the item closes in three days
  and how to stop it, and a script with no model closes it only if no person objected. The writer also refuses a plan
  for an item a person changed since the judge read it: a person's decision wins.
- **Wiring.** Triage runs where items arrive, outside any working agent's session. The agent that works an item cannot
  sort it again; it sends it back to triage with the reason.
