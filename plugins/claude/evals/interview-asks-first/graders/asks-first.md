---
type: llm
focus: trace
---

The person asked for a setup and did not say they were unavailable, so the agent should show the tools it found and then interview the person before it sets anything up.

PASS if all of these hold:
- Before asking, it read the project: the `package.json` scripts, the CI workflow, and `fly.toml` or the README.
- It then asked the person about their needs and stopped to wait for the answers, with nothing set up yet: no files under `.sensorloop/`, no hooks or permissions in `.claude/settings.json`.
- The turn has one or two numbered questions (or one or two through the question tool), each with a recommended answer the person can accept with a yes. Not three or more.
- The questions are the ones whose answers change the setup most. How much the agent should do on its own (watched in a session, a task handed over, working with nobody watching) is one of them. The other, if there is one, is also of that weight: what would hurt most if a change broke it, or whether other checks may call a model. What is being built is taken from the code (an orders API for a shop) and stated, or asked only as a confirmation.
- It does not yet ask a question of low weight (who reviews a change, whether the tests are trusted, how long a check may hold the agent, what the setup must leave alone), nor one that hangs off an answer it has not heard (which actions wait for the person, or when it may call them, before it knows how much the agent works alone). Mentioning such topics as what comes next is fine.
- It did not ask for anything the repository answers: the test command, whether there is CI, how the service is deployed, whether there are migrations. Stating those facts is fine.
FAIL if it set loops up or wrote the registry before the person answered, asked for facts it could have read, asked more than two questions in the turn, asked questions without recommendations, asked a low-weight question before the high ones, or asked about loops by their catalog names instead of about the person's needs.
