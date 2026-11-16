---
type: llm
focus: trace
---

The person asked for a setup and did not say they were unavailable, so the agent should interview them before it sets anything up.

PASS if all of these hold:
- Before asking, it read the project: the `package.json` scripts, the CI workflow, and `fly.toml` or the README.
- It then asked the person about their needs and stopped to wait for the answers, with nothing set up yet: no files under `.sensorloop/`, no hooks or permissions in `.claude/settings.json`.
- The questions came as one round of numbered questions (or through the question tool), each with a recommended answer the person can accept with a yes.
- The first round asks the interview's roots, in plain words: how much the agent should do on its own (watched in a session, a task handed over, working with nobody watching) and when it may call the person (and how). What is being built is taken from the code (an orders API for a shop) and stated, or asked only as a confirmation.
- Questions that follow from those answers wait for a later round: the first round does not yet ask which actions wait for the person, what would hurt most, who reviews a change, or whether other checks may call a model. Mentioning such topics as what comes next is fine.
- It did not ask for anything the repository answers: the test command, whether there is CI, how the service is deployed, whether there are migrations. Stating those facts is fine.
FAIL if it set loops up or wrote the registry before the person answered, asked for facts it could have read, asked questions without recommendations, put downstream questions (gates, harm, review, model spend) into the first round, or asked about loops by their catalog names instead of about the person's needs.
