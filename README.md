# CodeyCI — an open-source CI/CD pipeline for Salesforce DX

> **Not affiliated with Salesforce.** CodeyCI is an independent,
> community-maintained open-source project. It is **not** affiliated with,
> endorsed by, sponsored by, or supported by Salesforce, Inc. "Salesforce",
> "Salesforce DX", "SFDX", and **"Codey"** (the Salesforce mascot) are trademarks
> of Salesforce, Inc.; this project is named and described with reference to them
> only to indicate the platform it works with, and claims no rights in them. If
> Salesforce requests a change, we'll rename. See [`NOTICE`](NOTICE).

Distributable GitHub Actions for Salesforce DX repos. Behavior is controlled
through inputs, secrets, and an optional in-repo config file. Two adoption paths
(see [docs/consumer-setup.md](docs/consumer-setup.md)):

- **Reference (recommended)** — slim caller workflows call a pinned version
  (`@v1`) of these reusable workflows; a local `.codeyci/config.json`
  controls which features run and how.
- **Vendor** — copy a pinned version of the workflows + actions into your own
  repo and call them locally (`./…`). For air-gapped / strict-security orgs that
  must keep all executed CI code in-repo, reviewed and pinned.

- **Validate on PR** — delta-only, check-only `sf project deploy validate` with `RunLocalTests`.
- **Deploy on merge** — branch→environment mapping; reuses the PR's validation for a
  **quick deploy**, with an automatic full-deploy fallback.
- **Built on the modern `sf` CLI + sfdx-git-delta**, with pinnable Node/CLI/plugin versions.
- **Runs on GitHub-hosted or self-hosted** runners.
- **Optional field governance gate** — blocks new fields lacking permission-set access or
  required governance metadata.

**Start here:** [docs/consumer-setup.md](docs/consumer-setup.md) ·
[field governance](docs/field-governance.md) · example callers in [`examples/`](examples).

Workflows: [`sf-validate.yml`](.github/workflows/sf-validate.yml),
[`sf-deploy.yml`](.github/workflows/sf-deploy.yml). Gate action:
[`.github/actions/field-permset-gate`](.github/actions/field-permset-gate).

## License

Licensed under the [Apache License 2.0](LICENSE) — permissive, with an explicit
patent grant. You may use it in commercial and internal/government DevOps
pipelines. See [`NOTICE`](NOTICE) for attribution.

---

## Salesforce DX Project: Next Steps

Now that you’ve created a Salesforce DX project, what’s next? Here are some documentation resources to get you started.

## How Do You Plan to Deploy Your Changes?

Do you want to deploy a set of changes, or create a self-contained application? Choose a [development model](https://developer.salesforce.com/tools/vscode/en/user-guide/development-models).

## Configure Your Salesforce DX Project

The `sfdx-project.json` file contains useful configuration information for your project. See [Salesforce DX Project Configuration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm) in the _Salesforce DX Developer Guide_ for details about this file.

## Read All About It

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
