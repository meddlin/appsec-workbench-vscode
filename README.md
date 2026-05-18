# AppSec Sidecar

AppSec Sidecar is a TypeScript VS Code extension scaffold with starter workflows for calling the GitHub API and checking connectivity to a Postgres database.

## Features

- Store a GitHub personal access token in VS Code SecretStorage.
- Call the GitHub API as the authenticated user and show rate-limit status.
- Store Postgres connection details in VS Code SecretStorage.
- Run a read-only Postgres health check with `SELECT now() AS now`.

## Commands

- `AppSec Sidecar: Configure GitHub PAT`
- `AppSec Sidecar: Check GitHub API`
- `AppSec Sidecar: Configure Postgres`
- `AppSec Sidecar: Check Postgres`
- `AppSec Sidecar: Clear Stored Credentials`

## Development

Install dependencies:

```sh
npm install
```

Compile the extension:

```sh
npm run compile
```

Run lint checks:

```sh
npm run lint
```

Run extension tests:

```sh
npm test
```

Launch the Extension Development Host from VS Code with the `Run Extension` debug configuration.

## Credential Storage

This scaffold stores the GitHub PAT, Postgres connection string, optional Postgres username, and optional Postgres password in VS Code SecretStorage. Secrets are scoped to this extension and can be removed with `AppSec Sidecar: Clear Stored Credentials`.

The Postgres configuration command accepts a full connection string plus optional username and password overrides. The health check intentionally does not expose arbitrary SQL execution.
