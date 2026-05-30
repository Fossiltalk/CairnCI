# Consumer setup

> **Not affiliated with Salesforce.** CodeyCI is an independent,
> community-maintained project, not affiliated with or endorsed by Salesforce, Inc.
> "Salesforce", "SFDX", and "Codey" (the Salesforce mascot) are trademarks of
> Salesforce, Inc., referenced here nominatively only. See [`NOTICE`](../NOTICE).

CodeyCI is a set of **reusable GitHub Actions workflows** plus an optional
governance action. There are two supported ways to adopt it — pick one:

| | **Path A — Reference (recommended)** | **Path B — Vendor (clone in)** |
|---|---|---|
| How | Slim caller workflows call a pinned version of CodeyCI (`@v1`); a local config file controls features/behavior. | Copy a pinned version of CodeyCI's workflows + actions into your own repo and call them locally. |
| You maintain | A few short caller files + `.codeyci/*.json`. | The caller files **and** the copied pipeline code. |
| Updates | Bump the `@vX` tag. | Re-copy a newer tagged version. |
| Best for | Most teams; least to maintain. | Air-gapped / strict-security orgs that must keep **all** executed CI code in-repo, reviewed and pinned (common for government). |
| External dependency on CodeyCI at runtime | Yes (resolved from GitHub at run time). | No — everything runs from your repo. |

Sections 1–3 apply to **both** paths. Then do **either** §4A or §4B.

---

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

---

## 4A. Path A — Reference a pinned version (recommended)

You add small caller workflows; the heavy lifting stays in CodeyCI at the
version you pin. **Which features run** is decided by which callers you add;
**how they behave** is controlled by inputs and/or a committed config file (§6).

1. Copy the example callers into your repo's `.github/workflows/`:
   - [`examples/caller-validate.yml`](../examples/caller-validate.yml) — validate on PR.
   - [`examples/caller-deploy.yml`](../examples/caller-deploy.yml) — deploy on merge.
   - [`examples/caller-field-gate.yml`](../examples/caller-field-gate.yml) — optional governance gate.
2. **Pin the version.** Each caller references a released tag, e.g.
   `uses: Fossiltalk/CodeyCI/.github/workflows/sf-validate.yml@v1`. Use a
   major tag (`@v1`) for automatic minor updates, or pin to an exact tag/commit
   SHA for maximum reproducibility (recommended for production/government).
3. (Optional) Add [`examples/config.json`](../examples/config.json) at
   `.codeyci/config.json` and/or
   [`examples/field-policy.json`](../examples/field-policy.json) at
   `.codeyci/field-policy.json` to control behavior in-repo (§6).

A minimal validate caller:

```yaml
name: Salesforce Validate
on:
  pull_request:
    paths: ["force-app/**"]
jobs:
  validate:
    uses: Fossiltalk/CodeyCI/.github/workflows/sf-validate.yml@v1
    secrets: inherit
```

> **Use `secrets: inherit` in the caller.** Environment-scoped secrets only
> resolve inside the reusable workflow's environment-bound job — they can't be
> passed explicitly from the caller (the caller has no environment context). The
> examples already do this.

To **enable a feature**, add its caller; to **disable** one, remove that caller
file. To turn the field gate on/off without removing the file, gate its job with
an `if:` or a repo variable.

---

## 4B. Path B — Vendor a pinned version into your repo

Use this when policy requires every line of executed CI to live in your own repo,
reviewed and pinned (no external action references at run time).

1. **Copy a specific tagged version** of CodeyCI's pipeline into your repo,
   preserving paths:
   - `.github/workflows/sf-validate.yml`
   - `.github/workflows/sf-deploy.yml`
   - `.github/actions/**` (includes the field gate)

   For example, from a checkout of `CodeyCI` at tag `v1.2.0`:

   ```bash
   # run from the root of YOUR repo; SRC points at a CodeyCI checkout @ the tag
   SRC=/path/to/CodeyCI
   mkdir -p .github/workflows .github/actions
   cp "$SRC/.github/workflows/sf-validate.yml" .github/workflows/
   cp "$SRC/.github/workflows/sf-deploy.yml"   .github/workflows/
   cp -r "$SRC/.github/actions/." .github/actions/
   echo "vendored from Fossiltalk/CodeyCI@v1.2.0" > .github/actions/CODEYCI_VERSION
   ```

   Record the version you copied (the `CODEYCI_VERSION` marker above) so
   audits and future updates know exactly what's running.

2. **Add caller workflows that reference the copies locally** (note `./` instead
   of `Fossiltalk/CodeyCI/...@v1`). The repo's own dogfood callers are ready
   templates — copy them:
   - [`.github/workflows/ci-validate.yml`](../.github/workflows/ci-validate.yml)
   - [`.github/workflows/ci-deploy.yml`](../.github/workflows/ci-deploy.yml)

   ```yaml
   # .github/workflows/sf-validate.yml (your caller)
   name: Salesforce Validate
   on:
     pull_request:
       paths: ["force-app/**"]
   jobs:
     validate:
       uses: ./.github/workflows/sf-validate.yml   # local copy, pinned by what you vendored
       secrets: inherit
   ```

   The field gate is referenced locally too:
   `uses: ./.github/actions/field-permset-gate`.

3. (Optional) Add `.codeyci/config.json` / `.codeyci/field-policy.json`
   exactly as in Path A (§6) — the resolution logic is identical.

4. **Updating:** re-copy the workflows/actions from a newer CodeyCI tag and
   review the diff in a PR. Because there are no external `@vX` references, your
   pinned version is simply "whatever you last copied."

> Local `./` references resolve against **your** repo's checkout, which is why
> vendoring works without any cross-repo plumbing. (This is also why the
> reusable workflows are self-contained rather than split into separately
> referenced actions.)

---

## 5. How it behaves (both paths)

- **On every PR**: generates a delta of only the changed metadata, runs a
  **check-only** `sf project deploy validate` with `RunLocalTests`, and publishes
  the validation job-id as an artifact.
- **On merge to a deployable branch**: finds the validation produced for the
  merged PR and runs a **quick deploy** (no re-running tests). If no matching
  validation is available (e.g. you squash-merge, or it expired after ~10 days),
  it automatically falls back to a full deploy.

### 5a. Roll back the merge if a deploy fails (optional)

Validation can pass yet the real deploy still fail (timeouts, org-state drift,
row-lock errors, etc.). Salesforce auto-rolls-back the **org** on a failed
deploy, but your **git branch** still contains the merged change that never
landed. Set `rollback-strategy` (input or config) to re-align git with the org:

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

### 5b. Delta vs. full-branch deploys (optional)

By default (`delta: true`) only the metadata that changed is validated/deployed,
using [sfdx-git-delta](https://github.com/scolladon/sfdx-git-delta) — fast, and
the common case. Set `delta: false` (input or config) to validate/deploy the
**entire `source-dir`** instead. In full-branch mode the sfdx-git-delta plugin is
not installed or used at all.

> sfdx-git-delta is an unsigned Salesforce CLI plugin. Rather than auto-answering
> the install prompt, the pipeline adds it to the CLI's
> `unsignedPluginAllowList.json` so it installs without prompting. (See the
> [Salesforce allowlist docs](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_allowlist.htm).)

---

## 6. Configuration: inputs and/or a config file

You can configure behavior two ways, and **mix them freely** (works the same in
both adoption paths):

- **Workflow inputs** — the `with:` block in your caller workflow. Best for a
  setting that differs per caller or that you want visible right next to the
  trigger.
- **A committed config file** — `.codeyci/config.json` in your repo. Best
  for project-wide settings you want version-controlled and reviewed in PRs
  (ideal for audit/change-control). See [`examples/config.json`](../examples/config.json).

**Precedence: explicit input → config file → built-in default.** An input only
"wins" when you actually set it (the overridable inputs default to empty = unset),
so leaving an input out lets the config file supply it. With neither, the
built-in default applies.

Structural settings — `runs-on`, `environment`, and the `on:` triggers — are
evaluated before any step runs, so they **must** stay in the caller workflow
(they can't come from the file). The config file covers behavioral settings:
`sourceDir`, `testLevel`, `tests`, `wait`, `rollbackStrategy`.

The field gate follows the same precedence with its own
`.codeyci/field-policy.json` (see [field governance](field-governance.md)).

## 7. Inputs (all optional)

| Input            | Default          | Notes |
|------------------|------------------|-------|
| `source-dir`     | `force-app`      | Your SFDX source directory. |
| `delta`          | `true`           | `true` = only changed metadata (sfdx-git-delta); `false` = whole `source-dir`. See §5b. |
| `test-level`     | `RunLocalTests`  | `NoTestRun` / `RunSpecifiedTests` / `RunLocalTests` / `RunAllTestsInOrg`. |
| `tests`          | `""`             | Space/comma separated classes when `RunSpecifiedTests`. |
| `node-version`   | `lts/*`          | Latest Node LTS. sfdx-git-delta requires >= 20. |
| `sf-cli-version` | `latest`         | npm dist-tag or exact version. |
| `sgd-version`    | `stable`         | sfdx-git-delta dist-tag or exact version. |
| `runs-on`        | `["ubuntu-latest"]` | JSON array string. Self-hosted: `'["self-hosted","linux"]'`. |
| `wait`           | `60`             | Minutes to wait for the org job. |
| `environment`    | `""` (deploy only) | GitHub Environment to deploy to. |
| `rollback-strategy` | `none` (deploy only) | `none` / `revert-pr` / `revert-push`. See §5a. |
| `config-file`    | `.codeyci/config.json` | Path to the optional JSON config file. |

## 8. Runners

Works on GitHub-hosted and self-hosted Linux runners. On self-hosted runners the
toolchain install detects an existing `sf`/`sfdx-git-delta` at the requested
version and skips reinstalling. Self-hosted runners that are not GitHub-hosted
should have `git`, `node`, `npm`, `unzip`, and (for quick-deploy reuse) the `gh`
CLI available; if `gh` is missing the deploy job simply runs a full deploy.

## 9. Optional: field permission-set governance gate

See [`field-governance.md`](field-governance.md).
