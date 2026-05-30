# Field permission-set governance gate (optional)

A standalone action that fails a PR when newly added custom fields don't meet
your data-governance rules. It is **opt-in** — add it only when you want it.

## What it checks

For every custom field **added** in the PR (under `<source-dir>/**/fields/*.field-meta.xml`):

1. **Permission-set access** (`require-permission-set`, default on): the field must be
   granted (`readable` or `editable`) in at least one permission set in the repo.
2. **Specific access in specific permission sets** (`required-permission-sets`): e.g.
   `Sales_PS` must have `edit` on new `Opportunity` fields.
3. **Governance metadata** (each off by default), mapping to the field's XML:

   | Requirement                | Input                      | CustomField element                       |
   | -------------------------- | -------------------------- | ----------------------------------------- |
   | Data Owner                 | `require-data-owner`       | `<businessOwner>` / `<businessOwnerGroup>` |
   | Help Text                  | `require-help-text`        | `<inlineHelpText>`                         |
   | Description                | `require-description`      | `<description>`                           |
   | Field Usage                | `require-field-usage`      | `<businessStatus>`                        |
   | Data Sensitivity Level     | `require-data-sensitivity` | `<securityClassification>`                |
   | Compliance Categorization  | `require-compliance`       | `<complianceGroup>`                       |

Fields that **cannot** carry field-level security are automatically exempted from the
permission-set checks: `MasterDetail` fields and `required` fields.

## How failures surface

Each violation is emitted as an inline `::error` annotation on the offending
`.field-meta.xml` and summarized as a table in the job summary. A non-zero exit
fails the check, which you can make a required status check via branch protection.

## Usage

Add it as a step in a PR workflow — see
[`examples/caller-field-gate.yml`](../examples/caller-field-gate.yml). Reference the
action by released tag: `Fossiltalk/CodeyCI/.github/actions/field-permset-gate@v1`.

## Policy file

Instead of (or in addition to) inputs, commit a JSON policy file and point
`policy-file` at it. Keys in the file override the inputs. See
[`examples/field-policy.json`](../examples/field-policy.json).
