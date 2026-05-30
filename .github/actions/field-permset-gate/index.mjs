// Field permission-set governance gate.
//
// Dependency-free: uses Node core + `git` only. Parses the small, flat custom
// field / permission set metadata XML with targeted regexes (sufficient for
// these files — we are not parsing arbitrary XML).
//
// Exit code 1 (with annotations + a job summary) when any newly added custom
// field violates the configured governance rules.

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import path from "node:path";

const bool = (v) => String(v).toLowerCase() === "true";

// ---- Config: inputs, optionally overridden by a JSON policy file ----
const cfg = {
  sourceDir: process.env.INPUT_SOURCE_DIR || "force-app",
  baseRef: process.env.INPUT_BASE_REF || "",
  requirePermissionSet: bool(process.env.INPUT_REQUIRE_PERMISSION_SET),
  requiredPermissionSets: parseJson(process.env.INPUT_REQUIRED_PERMISSION_SETS, []),
  requireDescription: bool(process.env.INPUT_REQUIRE_DESCRIPTION),
  requireHelpText: bool(process.env.INPUT_REQUIRE_HELP_TEXT),
  requireDataOwner: bool(process.env.INPUT_REQUIRE_DATA_OWNER),
  requireFieldUsage: bool(process.env.INPUT_REQUIRE_FIELD_USAGE),
  requireDataSensitivity: bool(process.env.INPUT_REQUIRE_DATA_SENSITIVITY),
  requireCompliance: bool(process.env.INPUT_REQUIRE_COMPLIANCE),
};

const policyFile = process.env.INPUT_POLICY_FILE || "";
if (policyFile && existsSync(policyFile)) {
  const policy = parseJson(readFileSync(policyFile, "utf8"), {});
  Object.assign(cfg, policy);
  console.log(`Loaded policy overrides from ${policyFile}`);
}

function parseJson(raw, fallback) {
  if (!raw || !String(raw).trim()) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log(`::warning::Could not parse JSON config: ${e.message}`);
    return fallback;
  }
}

// ---- Tiny XML helpers (single-level tag text) ----
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1].trim() : "";
};
const has = (xml, name) => tag(xml, name).length > 0;

// ---- 1. Find newly added custom field files ----
function addedFieldFiles() {
  const ref = cfg.baseRef && cfg.baseRef !== "origin/" ? cfg.baseRef : "HEAD^";
  let out = "";
  try {
    out = execFileSync(
      "git",
      ["diff", "--name-only", "--diff-filter=A", `${ref}...HEAD`, "--", `${cfg.sourceDir}/**/fields/*.field-meta.xml`],
      { encoding: "utf8" }
    );
  } catch (e) {
    // Fall back to a non-triple-dot diff if the merge base can't be resolved.
    out = execFileSync(
      "git",
      ["diff", "--name-only", "--diff-filter=A", ref, "HEAD", "--", `${cfg.sourceDir}/**/fields/*.field-meta.xml`],
      { encoding: "utf8" }
    );
  }
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

// Object API name and field API name from the file path.
function identify(file) {
  const field = path.basename(file).replace(/\.field-meta\.xml$/i, "");
  const parts = file.split(/[\\/]/);
  const fieldsIdx = parts.lastIndexOf("fields");
  const object = fieldsIdx > 0 ? parts[fieldsIdx - 1] : "UNKNOWN";
  return { object, field, qualified: `${object}.${field}` };
}

// Fields that cannot carry field-level security and are legitimately absent
// from permission sets.
function fieldExemptFromFls(xml) {
  const type = tag(xml, "type");
  if (/^MasterDetail$/i.test(type)) return true;
  if (bool(tag(xml, "required"))) return true;
  return false;
}

// ---- 2. Index field permissions across all permission sets ----
function indexPermissionSets() {
  let files = "";
  try {
    files = execFileSync(
      "git",
      ["ls-files", `${cfg.sourceDir}/**/permissionsets/*.permissionset-meta.xml`],
      { encoding: "utf8" }
    );
  } catch {
    files = "";
  }
  // Map: qualified field -> [{ permissionSet, readable, editable }]
  const grants = new Map();
  for (const f of files.split("\n").map((s) => s.trim()).filter(Boolean)) {
    const psName = path.basename(f).replace(/\.permissionset-meta\.xml$/i, "");
    const xml = readFileSync(f, "utf8");
    const blocks = xml.match(/<fieldPermissions>[\s\S]*?<\/fieldPermissions>/gi) || [];
    for (const b of blocks) {
      const field = tag(b, "field");
      if (!field) continue;
      const entry = { permissionSet: psName, readable: bool(tag(b, "readable")), editable: bool(tag(b, "editable")) };
      if (!grants.has(field)) grants.set(field, []);
      grants.get(field).push(entry);
    }
  }
  return grants;
}

// ---- 3. Evaluate ----
const violations = []; // { file, message }
const addRules = Array.isArray(cfg.requiredPermissionSets) ? cfg.requiredPermissionSets : [];

const files = addedFieldFiles();
const grants = indexPermissionSets();

const attrChecks = [
  ["requireDescription", "description", "Description"],
  ["requireHelpText", "inlineHelpText", "Help Text"],
  ["requireFieldUsage", "businessStatus", "Field Usage"],
  ["requireDataSensitivity", "securityClassification", "Data Sensitivity Level"],
  ["requireCompliance", "complianceGroup", "Compliance Categorization"],
];

for (const file of files) {
  if (!existsSync(file)) continue;
  const xml = readFileSync(file, "utf8");
  const { object, field, qualified } = identify(file);
  const exempt = fieldExemptFromFls(xml);
  const fieldGrants = grants.get(qualified) || [];

  // 3a. At least one permission set.
  if (cfg.requirePermissionSet && !exempt) {
    const granted = fieldGrants.some((g) => g.readable || g.editable);
    if (!granted) {
      violations.push({ file, message: `${qualified} is not granted in any permission set. Add it to at least one permission set (readable/editable).` });
    }
  }

  // 3b. Specific access in specific permission sets.
  for (const rule of addRules) {
    if (!rule || !rule.permissionSet) continue;
    if (Array.isArray(rule.objects) && rule.objects.length && !rule.objects.includes(object)) continue;
    if (exempt) continue;
    const g = fieldGrants.find((x) => x.permissionSet === rule.permissionSet);
    const needEdit = String(rule.access).toLowerCase() === "edit";
    const ok = g && (needEdit ? g.editable : g.readable || g.editable);
    if (!ok) {
      violations.push({ file, message: `${qualified} must be ${needEdit ? "editable" : "readable"} in permission set '${rule.permissionSet}'.` });
    }
  }

  // 3c. Attribute requirements.
  if (cfg.requireDataOwner && !(has(xml, "businessOwner") || has(xml, "businessOwnerGroup"))) {
    violations.push({ file, message: `${qualified} is missing a Data Owner (<businessOwner> or <businessOwnerGroup>).` });
  }
  for (const [flag, tagName, label] of attrChecks) {
    if (cfg[flag] && !has(xml, tagName)) {
      violations.push({ file, message: `${qualified} is missing ${label} (<${tagName}>).` });
    }
  }
}

// ---- 4. Report ----
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
function summary(md) {
  if (summaryPath) appendFileSync(summaryPath, md + "\n");
}

console.log(`Checked ${files.length} newly added field(s).`);
if (violations.length === 0) {
  summary(`### ✅ Field governance gate passed\n\nChecked ${files.length} newly added field(s); no violations.`);
  console.log("Field governance gate passed.");
  process.exit(0);
}

summary(`### ❌ Field governance gate failed\n\n${violations.length} violation(s):\n\n| Field file | Problem |\n| --- | --- |`);
for (const v of violations) {
  console.log(`::error file=${v.file},line=1::${v.message}`);
  summary(`| \`${v.file}\` | ${v.message} |`);
}
console.error(`\nField governance gate failed with ${violations.length} violation(s).`);
process.exit(1);
