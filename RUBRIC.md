# The RegLens scoring rubric

**Rubric version:** `2026-07-30.1` · Applies to bill and agency-rule assessments
produced by [reglens.info](https://www.reglens.info)

This document specifies how a RegLens risk score is produced. It describes the
**implementation**, not an intention: every weight, threshold and fallback below
is transcribed from the production scoring code, and the worked example can be
reproduced by hand against any published assessment.

[`rubric.json`](rubric.json) carries the same values machine-readably and is
**generated from the analyzer source**, not retyped. [`PROMPTS.md`](PROMPTS.md)
has the prompts the model actually receives.

The prose version at
[reglens.info/methodology](https://www.reglens.info/methodology) renders from the
same constants this document describes. Where any of them disagree, that is a
bug — see [Single source](#single-source).

## The division of labour

A RegLens score is part model judgment and part fixed arithmetic, and the line
between them is deliberate:

| Produced by the AI model | Computed on our servers |
| --- | --- |
| The individual dimension scores (1–5) | The composite score |
| The passage likelihood | The risk tier |
| Summaries, reasoning, industry impacts | All clamping and validation |

**The model's own composite score and risk tier are discarded.** It is asked for
them, and what it returns is overwritten by the server's recomputation from the
weights and thresholds below. The risk tier drives the risk-escalation alert
trigger, so it has to be deterministic and reproducible rather than whatever the
model asserted.

## The 1–5 scale

Every dimension, for both bills and rules, uses one scale:

| Score | Meaning |
| --- | --- |
| 5 | Transformative impact, immediate action required |
| 4 | Major changes required |
| 3 | Moderate, manageable changes |
| 2 | Minor adjustments |
| 1 | Minimal impact |

These five labels are the entire anchor set. They are shared across all
dimensions — there is no separate definition of what a 4 means on Cost versus a 4
on Timeline. See [Known gaps](#known-gaps).

## Bills — full analysis

### Dimensions and weights

| Dimension | What it measures | Weight |
| --- | --- | ---: |
| Operational | Changes to how affected businesses must operate | 0.25 |
| Compliance | New regulatory obligations and reporting burdens | 0.20 |
| Cost | Direct financial impact of complying | 0.20 |
| Market Access | Effects on the ability to enter or serve markets | 0.15 |
| Timeline | How soon the impact would be felt | 0.20 |

Weights sum to 1.00.

### Composite

```
composite = round2(
    0.25 × operational
  + 0.20 × compliance
  + 0.20 × cost
  + 0.15 × market_access
  + 0.20 × timeline
)
```

Each dimension score is normalized first (see
[Normalization](#normalization-and-fail-safes)). The result is rounded to two
decimal places.

### Risk tier

Evaluated in order; the first matching rule wins.

| # | Tier | Condition |
| --- | --- | --- |
| 1 | **Critical** | composite ≥ 4.0 **and** passage likelihood is High |
| 2 | **High** | composite ≥ 3.5, **or** composite ≥ 3.0 with High passage likelihood |
| 3 | **Medium** | composite ≥ 2.5 |
| 4 | **Low** | everything else |

Then one override, applied last and unconditionally:

> **If passage likelihood is Very Low, the tier is Low** — regardless of the
> composite score.

A bill can therefore score 4.8 on impact and still be tiered Low. That is
intended: a transformative bill that will not pass is not a live risk.

### Worked example

Operational 4, Compliance 3, Cost 4, Market Access 2, Timeline 4:

```
0.25 × 4 = 1.00
0.20 × 3 = 0.60
0.20 × 4 = 0.80
0.15 × 2 = 0.30
0.20 × 4 = 0.80
           ────
composite  3.50
```

- With **High** passage likelihood → **High** (rule 2; Critical needs ≥ 4.0).
- With **Medium** or **Low** → **High** (rule 2, first clause).
- With **Very Low** → **Low** (the override).

## Bills — light analysis

Bulk triage passes read only the bill's title, status and jurisdiction. They
differ from full analyses in three ways that matter when reading a score:

1. **There are no independent dimension scores.** All five columns hold the
   composite, mirrored. Bill pages hide the dimension chart for these rather than
   render five identical bars.
2. **The composite is the model's own number**, clamped to 1–5 — not recomputed
   from weights, because there are no dimensions to weight. Note it is clamped
   but *not* rounded, so light composites can be fractional where full-analysis
   dimension scores never are.
3. **Passage likelihood does not affect the tier.** The tier comes from the
   composite thresholds alone: Critical ≥ 4.0, High ≥ 3.5, Medium ≥ 2.5,
   otherwise Low. Neither the High-passage escalation nor the Very-Low cap
   applies.

Every assessment carries a badge stating its evidence base — **Full text**,
**Metadata only** or **Quick scan** — recorded at analysis time along with the
number of characters actually sent to the model. Assessments produced before that
was recorded carry no badge: unknown is reported as unknown, never assumed.

A *full* analysis is not necessarily a *full-text* one. Full analyses receive bill
text when available (currently the first 30,000 characters) plus sponsors,
committee assignments and the ten most recent actions. Bulk passes are
deliberately metadata-only: they read already-cached text but never fetch new text
from an upstream API. When no text is available the model is told so explicitly.

## Passage likelihood

Four levels: **High**, **Medium**, **Low**, **Very Low**, each with written
reasoning.

The model bases the judgment on the legislative evidence supplied with the bill:
current status and stage, sponsors (including party and primary-sponsor status),
committee referrals, the ten most recent actions and their dates, and the bill
text when available.

Passage likelihood is a model judgment. Unlike the composite it is not
recomputed — only validated against the four permitted values.

## Agency rules

Federal agency actions (proposed and final rules from the Federal Register) use
the same 1–5 scale and the same server-side recomputation, with three dimensions
instead of five:

| Dimension | Weight |
| --- | ---: |
| Operational | 0.40 |
| Compliance | 0.35 |
| Cost | 0.25 |

```
composite = round2(0.40 × operational + 0.35 × compliance + 0.25 × cost)
```

| Tier | Condition |
| --- | --- |
| Critical | composite ≥ 4.0 |
| High | composite ≥ 3.5 |
| Medium | composite ≥ 2.5 |
| Low | composite < 2.5 |

**Rule tiers do not depend on passage likelihood** — there is no such field for
rules. An issued rule is already on its way, so there is nothing to handicap.

Rule assessments state their evidence base directly on the card: "Based on the
full rule text" when the Federal Register full text was analyzed (the first
~12,000 characters), or "Based on rule metadata only" when it was not.

## Normalization and fail-safes

Applied to every full-analysis dimension score before the composite is computed:

```
clamp(x) = isFinite(x) ? min(5, max(1, round(x))) : 1
```

Three consequences worth stating plainly:

- **Scores are rounded to integers.** A model-returned 3.7 becomes 4 before
  weighting. Dimension scores are integers; only the composite is fractional.
- **A missing or unparseable score becomes 1**, not null and not an error.
- **Out-of-range scores are pulled to the boundary**, so a 0 or a 9 cannot
  distort a composite.

The same principle governs the enumerated fields:

| Field | Invalid value becomes |
| --- | --- |
| Passage likelihood | `Low` |
| Risk tier (post-computation guard) | `Low` |
| Bill category | `substantive` |
| Sectors | empty list |

Every one of these defaults downward. A malformed model response can cause
RegLens to under-alarm; by construction it cannot cause it to over-alarm.

## Single source

The weights and thresholds used to live in three places per analyzer — the prompt
text that *tells* the model, the server code that *recomputes* the composite, and
the methodology page that *documents* them. Editing one without the others changed
nothing anyone would notice until a score came out wrong, and nothing in CI could
catch it.

Since 2026-08-05 all three derive from one module,
`supabase/functions/_shared/scoring.ts`, which renders the prompt sections, backs
the recomputation, and feeds the methodology page's tables. [`rubric.json`](rubric.json)
and the prompt text in [`PROMPTS.md`](PROMPTS.md) are generated from that same
module. A weight cannot now be changed in one place only.

## Versioning

The full and light bill prompts carry independent version strings, currently both
`2026-07-30.1`, stamped onto each analysis row at write time. They are tracked
separately because the two prompts evolve independently, and the analysis mode
alone cannot say which revision of a prompt a given row came from.

Scores are **not** retroactively recomputed when the rubric changes; an assessment
displays when it was generated. Assessments are cached and shared — a bill or rule
is analyzed once and the same assessment is shown to everyone until a re-analysis
is run.

## Known gaps

Stated here rather than papered over.

- **No per-dimension anchors.** The five scale labels are generic and shared
  across all dimensions and both bills and rules. Nothing tells the model — or a
  reader — what separates a 3 from a 4 specifically on Market Access. This is the
  largest source of scoring variance and the most valuable thing to fix.
- **The rubric version is really the prompt version.** It bumps when prompt text
  changes. A weight or threshold edited in `scoring.ts` changes every subsequent
  score *without* bumping it, so a published "rubric version" can currently
  understate what changed. Giving the rubric its own version string is open work.
- **No published calibration yet.** Bills resolve, so passage-likelihood ratings
  are checkable against realized outcomes. [VALIDATION.md](VALIDATION.md) now
  holds that record and fixes the counting rules in advance — but every tier's
  resolved sample is still zero, so it reports no enacted rates. The record
  exists; the calibration does not. Until bills in the assessed window actually
  resolve, treat passage likelihood as an unvalidated model judgment.
- **Light-mode composites are unverifiable.** They come from the model rather than
  from weighted dimensions, so the server-side integrity guarantee that covers
  full analyses does not extend to them.

## Scope

This document covers impact scoring only. Momentum and the flame scale,
organization-level exposure analysis, and industry relevance scoring are described
at [reglens.info/methodology](https://www.reglens.info/methodology) and are not
part of this rubric.

## Limitations

Composite scores and tiers are computed from the fixed rules above, but the
dimension scores, summaries and reasoning underneath them are model judgments and
can be wrong. Source records may be incomplete, delayed or unavailable. Every
bill, law, rule and case in RegLens links back to its official source — the
primary record always wins.

RegLens assessments are provided for informational purposes only and do not
constitute investment, legal or tax advice. Consult a qualified professional
before acting.
