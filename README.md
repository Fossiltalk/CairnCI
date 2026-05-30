# salesforceci — a modern, extensible Salesforce CI pipeline

Distributable GitHub Actions for Salesforce DX repos. Consumers add a short
caller workflow that calls these versioned **reusable workflows**; all behavior is
controlled through inputs and secrets — no pipeline logic is copied into the
consumer repo.

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
