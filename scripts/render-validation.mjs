#!/usr/bin/env node
// Render VALIDATION.md from a get_public_validation() payload.
//
// Reads the JSON payload on stdin and writes markdown to stdout. Pure: no
// network, no filesystem, no clock — every date in the output comes from the
// payload, never from this process, so the workflow's commit-on-change check
// is meaningful (a run where the record did not move produces a byte-identical
// file). Same contract as .github's render-coverage.mjs.
//
// Usage:  node scripts/render-validation.mjs < payload.json > VALIDATION.md

import { pathToFileURL } from "node:url";

const TIER_ORDER = ["High", "Medium", "Low", "Very Low"];

const num = (n) => Number(n ?? 0).toLocaleString("en-US");

/** NULL rate renders as an em dash — never 0, never blank. */
const rate = (r) => (r === null || r === undefined ? "—" : `${r}%`);

export function renderValidation(payload) {
  const tiers = payload?.tiers ?? [];
  if (tiers.length !== TIER_ORDER.length) {
    // A technically-successful-but-empty response must fail here rather than
    // replace the published record with a blank one (the coverage renderer's
    // zero-jurisdictions guard, same reasoning).
    throw new Error(
      `expected ${TIER_ORDER.length} tiers, got ${tiers.length} — refusing to render`,
    );
  }
  const byName = new Map(tiers.map((t) => [t.likelihood, t]));
  for (const name of TIER_ORDER) {
    if (!byName.has(name)) throw new Error(`payload is missing the ${name} tier`);
  }

  const allUnresolved = tiers.every((t) => (t.n_terminal ?? 0) === 0);

  const lines = [];
  lines.push("# Validation");
  lines.push("");
  lines.push(
    "How RegLens's passage-likelihood calls are checked against what actually",
    "happened — with the protocol published **before** the first resolved sample",
    "exists, so the eventual rates cannot be accused of survivorship or of rules",
    "tuned after the fact.",
  );
  lines.push("");
  lines.push(
    "*A generated file: rendered from the same anonymous endpoint the site reads",
    "(`get_public_validation`). Edit `scripts/render-validation.mjs`, not this",
    "file — hand edits are overwritten on the next refresh.*",
  );
  lines.push("");
  lines.push("## What is measured");
  lines.push("");
  lines.push(
    "Every full bill analysis includes a passage likelihood — High, Medium, Low",
    "or Very Low. Each night, every current call is joined to its bill's realized",
    "outcome. The question this file answers is: **of the bills called High (or",
    "Medium, or Low…) before their fate was sealed, what fraction were actually",
    "enacted?**",
  );
  lines.push("");
  lines.push("## The rules, fixed in advance");
  lines.push("");
  lines.push(
    "- **Outcomes are classified conservatively.** A bill counts as enacted,",
    "  vetoed, or dead only when its legislative record says so. Congress marks",
    "  nothing \"dead\", so a federal bill that quietly stalls stays *unresolved*",
    "  forever rather than being guessed dead; federal enactments are recognized",
    "  only through the enacted-laws record.",
    "- **Hindsight is excluded.** An analysis run on or after the day the outcome",
    "  landed — or whose timing cannot be verified against an outcome date — is",
    "  counted in its own visible column and never enters the rate.",
    "- **Unresolved bills are not failures.** They are censored: out of the",
    "  denominator until they resolve, however long that takes.",
    "- **Latest call only.** A bill re-analyzed as it moves carries its most",
    "  recent pre-outcome call, not its first. (First-call calibration becomes",
    "  possible as the assessment history accumulates and is a stated future",
    "  refinement.)",
  );
  lines.push("");
  lines.push("## The record");
  lines.push("");
  lines.push(
    `As of **${payload.snapshot_date}** — the record began **${payload.first_snapshot_date}**:`,
  );
  lines.push("");
  lines.push(
    "| Tier | Assessed | Unresolved | Excluded (hindsight / unverifiable) | Resolved sample | Enacted rate |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const name of TIER_ORDER) {
    const t = byName.get(name);
    lines.push(
      `| ${name} | ${num(t.n_assessed)} | ${num(t.n_pending)} | ${num(t.n_post_hoc)} | ${num(t.n_terminal)} | ${rate(t.enacted_rate)} |`,
    );
  }
  if (allUnresolved) {
    lines.push("");
    lines.push(
      "> **No prediction made before its bill's outcome has resolved yet.** The",
      "> corpus was analyzed largely after import, so the outcomes already on the",
      "> record are excluded as hindsight by the rules above. Rates appear here as",
      "> live predictions resolve; the columns and exclusions are fixed now, before",
      "> the first number exists.",
    );
  }
  lines.push("");
  lines.push("## Read the numbers with these limits");
  lines.push("");
  lines.push(
    "- Only bills RegLens scored are in the pool, and only those that resolved",
    "  enter a rate — which skews the early sample toward faster-moving bills.",
    "- Judge every rate against its **Resolved sample** column. A rate over a",
    "  handful of bills is an anecdote, not a calibration.",
    "- A passage likelihood is a historical frequency claim, not a probability",
    "  guarantee about any single bill.",
  );
  lines.push("");
  lines.push("## Cadence");
  lines.push("");
  lines.push(
    "The underlying record updates nightly. This file is refreshed quarterly",
    "(January, April, July, October) by `.github/workflows/validation-refresh.yml`,",
    "committing only when the record moved. The live, always-current version is on",
    "[reglens.info/methodology](https://www.reglens.info/methodology).",
  );
  lines.push("");
  return lines.join("\n");
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  let raw = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
  process.stdout.write(renderValidation(JSON.parse(raw)));
}
