# Consumer setup

This pipeline ships as **reusable GitHub Actions workflows**. You add two short
caller workflows to your Salesforce DX repo and configure secrets — all behavior
is controlled through inputs and environment variables. You never copy the
pipeline logic into your repo.

## 1. Prerequisites

- A Salesforce DX repo (your metadata under `force-app/`, an `sfdx-project.json`).
- One Salesforce org per deployable branch (e.g. a dev sandbox, UAT, production).
- Branching that maps each deployable branch to an org (e.g. `develop` → dev
  sandbox, `uat` → UAT, `main` → production).

## 2. Get an SFDX auth URL for each org

```bash
sf org login web --alias myorg          # one-time, interactive
sf org display --target-org myorg --verbose   # copy the "Sfdx Auth Url" (force://...)
```

## 3. Store the auth URL as a secret

Use **GitHub Environments** so each branch deploys to the right org and you get
deployment protection rules for free:

1. Repo **Settings → Environments → New environment**. Name it to match the
   branch (e.g. `develop`, `uat`, `main`).
2. In each environment add a secret named `SFDX_AUTH_URL` with that org's URL.
3. (Optional) Add required reviewers / wait timers on the `main` environment to
   gate production.

For validation only (PRs), a single repository-level `SFDX_AUTH_URL` secret
pointing at a sandbox is enough.

## 4. Add the caller workflows

Copy [`examples/caller-validate.yml`](../examples/caller-validate.yml) and
[`examples/caller-deploy.yml`](../examples/caller-deploy.yml) into your repo's
`.github/workflows/`. Pin to a released major tag (`@v1`).

> **Use `secrets: inherit` in the caller.** Environment-scoped secrets only
> resolve inside the reusable workflow's environment-bound job — they can't be
> passed explicitly from the caller (the caller has no environment context). The
> examples already do this.

## 5. How it behaves

- **On every PR** (`caller-validate`): generates a delta of only the changed
  metadata, runs a **check-only** `sf project deploy validate` with
  `RunLocalTests`, and publishes the validation job-id as an artifact.
- **On merge to a deployable branch** (`caller-deploy`): finds the validation
  produced for the merged PR and runs a **quick deploy** (no re-running tests).
  If no matching validation is available (e.g. you squash-merge, or it expired
  after ~10 days), it automatically falls back to a full deploy.

## 5a. Roll back the merge if a deploy fails (optional)

Validation can pass yet the real deploy still fail (timeouts, org-state drift,
row-lock errors, etc.). Salesforce auto-rolls-back the **org** on a failed
deploy, but your **git branch** still contains the merged change that never
landed. Set `rollback-strategy` on the deploy caller to re-align git with the org:

- `none` (default) — do nothing.
- `revert-pr` — open a PR that reverts the merged change(s). **Recommended for
  protected branches** (where Actions can't push directly).
- `revert-push` — push the revert straight to the branch. Requires the branch to
  allow pushes from `GITHUB_TOKEN`.

The revert handles all merge strategies (merge commit, squash, rebase). The
deploy job still reports failure so the problem stays visible.

**Permissions:** rollback needs the workflow token to have `contents: write`
(and `pull-requests: write` for `revert-pr`). Ensure your repo's
**Settings → Actions → General → Workflow permissions** is set to *Read and
write*, or grant it in your caller workflow — the reusable workflow can't exceed
what your repo allows.

## 6. Inputs (all optional)

| Input            | Default          | Notes |
|------------------|------------------|-------|
| `source-dir`     | `force-app`      | Your SFDX source directory. |
| `test-level`     | `RunLocalTests`  | `NoTestRun` / `RunSpecifiedTests` / `RunLocalTests` / `RunAllTestsInOrg`. |
| `tests`          | `""`             | Space/comma separated classes when `RunSpecifiedTests`. |
| `node-version`   | `20`             | sfdx-git-delta requires >= 20. |
| `sf-cli-version` | `latest`         | npm dist-tag or exact version. |
| `sgd-version`    | `latest`         | sfdx-git-delta version. |
| `runs-on`        | `["ubuntu-latest"]` | JSON array string. Self-hosted: `'["self-hosted","linux"]'`. |
| `wait`           | `60`             | Minutes to wait for the org job. |
| `environment`    | `""` (deploy only) | GitHub Environment to deploy to. |
| `rollback-strategy` | `none` (deploy only) | `none` / `revert-pr` / `revert-push`. See §5a. |

## 7. Runners

Works on GitHub-hosted and self-hosted Linux runners. On self-hosted runners the
toolchain install detects an existing `sf`/`sfdx-git-delta` at the requested
version and skips reinstalling. Self-hosted runners that are not GitHub-hosted
should have `git`, `node`, `npm`, `unzip`, and (for quick-deploy reuse) the `gh`
CLI available; if `gh` is missing the deploy job simply runs a full deploy.

## 8. Optional: field permission-set governance gate

See [`field-governance.md`](field-governance.md).
