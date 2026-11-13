---
title: Scripted model responses
summary: Replaces a language model in tests with recorded or scripted responses, so tests of an AI feature give the same result every time.
sensors: [test-runner]
layer: project
---

A test of a feature that calls a language model would get a different answer on every run. This tool puts recorded or
scripted responses in the model's place, so the test checks the code around the model and gives the same result every
time.

## Finding it

How the project does it is found in its test suite: a fake model provider or client, a fixture that starts a mock
model server, or a directory of recorded responses (cassettes). The test dependencies name the recording library, if
there is one. The setting that holds the model's address or client is where the fake is swapped in.

## Using it

- **Fail on anything not mocked**: a request with no recorded or scripted answer is an error, never a call to the real
  model.
- **Re-record on purpose**: recordings are replaced by a deliberate run and reviewed with the change, never refreshed
  because a test happened to miss one.
- **Scrub secrets**: keys, tokens and personal data are removed from recordings before they are committed.

Examples: a fake model provider in the test suite, a mock model server, recorded HTTP responses (cassettes, for
example with VCR.py in Python).
