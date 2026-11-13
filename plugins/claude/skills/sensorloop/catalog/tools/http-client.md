---
title: HTTP client
summary: Sends a request to a service and shows exactly what came back.
sensors: [smoke-probe, manual-probe]
layer: project
---

An HTTP client sends one request to a service and shows what came back: the status, the headers and the body. It
works the same against a service in any stack.

## Finding it

- **On the machine**: curl is installed on most systems; `curl --version` confirms it.
- **The address and credentials**: the README, an example environment file (`.env.example`), the API's OpenAPI
  description.
- **Requests the project keeps**: `.http` files or a collection, which show the headers and the body a call needs.

## Using it

- **Turn an HTTP error into a non-zero exit code**: `curl --fail`, or `--fail-with-body` to keep the error's body.
- **Print the status code alongside the body**: `curl -sS -w '\n%{http_code}\n' <url>`; `-i` adds the headers,
  `-v` the request too.
- **Bound the wait** with `--max-time`, so a hung service fails the call instead of hanging it.
- **Read tokens from the environment**, never typed into the command, where they stay in the history and the logs.

Examples: curl, HTTPie, grpcurl (gRPC).
