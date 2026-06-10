# AppSec Workbench

AppSec Workbench is a TypeScript VS Code extension scaffold with starter workflows
for calling the GitHub API and checking connectivity to a Postgres database.

## Features

- Store a GitHub personal access token in VS Code SecretStorage.
- Call the GitHub API as the authenticated user and show rate-limit status.
- Store Postgres connection details in VS Code SecretStorage.
- Run a read-only Postgres health check with `SELECT now() AS now`.
- View repository inventory and CodeQL/Dependabot vulnerability findings in React webview panels.

## Commands

- `AppSec Workbench: Configure GitHub PAT`
- `AppSec Workbench: Check GitHub API`
- `AppSec Workbench: Configure Postgres`
- `AppSec Workbench: Check Postgres`
- `AppSec Workbench: View Repo Inventory`
- `AppSec Workbench: Repo Vuln Findings`
- `AppSec Workbench: Clear Stored Credentials`

## Development

Install dependencies:

```sh
npm install
```

Compile the extension:

```sh
npm run compile
```

Build only the React webview assets:

```sh
npm run build:webview
```

### Webview Browser Harness

Use the Vite browser harness when you are iterating on React webview UI and do
not need the full VS Code Extension Development Host. It runs the same shared
`App` component used by the production webview, but supplies local sample
payloads and a mocked `acquireVsCodeApi()` implementation.

Start the harness:

```sh
npm run dev:webview
```

The command starts Vite at `http://127.0.0.1:5173/` and opens the findings
preview. Vite hot reloads edits under `src/webview`, including components,
styles, and sample data.

Preview states:

```text
http://localhost:5173/src/webview/dev/index.html?view=findings
http://localhost:5173/src/webview/dev/index.html?view=inventory
http://localhost:5173/src/webview/dev/index.html?view=empty
http://localhost:5173/src/webview/dev/index.html?view=empty-inventory
http://localhost:5173/src/webview/dev/index.html?view=none
```

Add `&theme=light` or `&theme=dark` to switch mocked VS Code theme variables:

```text
http://localhost:5173/src/webview/dev/index.html?view=findings&theme=light
```

Sample payloads live in `src/webview/dev/sampleData.ts`. Update that file when
you need to preview new table shapes, long strings, missing values, empty
states, or severity combinations.

In the harness, GitHub `Open` buttons do not navigate directly. They call the
mocked VS Code API and log the message to the browser console:

```text
[mock acquireVsCodeApi.postMessage] { type: "openExternal", url: "..." }
```

Use the full Extension Development Host when you need to verify command
registration, SecretStorage, Postgres data loading, VS Code webview CSP
behavior, or real external link opening.

Run lint checks:

```sh
npm run lint
```

Run extension tests:

```sh
npm test
```

Launch the Extension Development Host from VS Code with the `Run Extension`
debug configuration.

## Credential Storage

This scaffold stores the GitHub PAT, Postgres connection string, optional
Postgres username, and optional Postgres password in VS Code SecretStorage.
Secrets are scoped to this extension and can be removed with `AppSec Workbench:
Clear Stored Credentials`.

The Postgres configuration command accepts a full connection string plus
optional username and password overrides. The health check intentionally does
not expose arbitrary SQL execution.
