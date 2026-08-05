# reglens-method

**How every RegLens score is produced.**

[RegLens](https://www.reglens.info) scores federal and state legislation and
federal rulemaking for regulatory risk and industry impact. This repository is
the specification behind those numbers: the dimensions, the weights, the
thresholds, and the prompts the model actually receives.

It is published so the scores are checkable rather than taken on trust. Nothing
here is a summary — the values are the production values, and the prompts are
verbatim.

## Contents

| File | What it is |
| --- | --- |
| [RUBRIC.md](RUBRIC.md) | The specification. Dimensions, weights, tier thresholds, passage likelihood, normalization, and the known gaps. |
| [rubric.json](rubric.json) | The same values, machine-readable. Generated from the analyzer source. |
| [PROMPTS.md](PROMPTS.md) | The system prompts sent to the model, verbatim, with the industry taxonomy. |
| [CHANGELOG.md](CHANGELOG.md) | Every change to the rubric, dated. |

## The one thing worth knowing

A RegLens score is part model judgment and part fixed arithmetic, and the split
is deliberate: **the model's own composite score and risk tier are discarded.**
It is asked for both; the server recomputes both from the published weights and
thresholds. What the model contributes is the individual 1–5 dimension scores,
the passage likelihood, and the written reasoning.

That is what makes this repository meaningful. Given a published assessment's
five dimension scores you can reproduce its tier by hand from
[RUBRIC.md](RUBRIC.md), and if you cannot, one of us has a bug.

## Reproducing a score

Take any bill page on reglens.info showing per-dimension scores, then follow the
worked example in [RUBRIC.md](RUBRIC.md#worked-example). The weighted composite
and the tier ladder are the whole calculation — there is no hidden term.

## How these files are produced

`rubric.json` and `PROMPTS.md` are generated from
`supabase/functions/_shared/scoring.ts` in the (private) application repository —
the same module that renders the prompt sections the model receives, backs the
server-side recomputation, and feeds the tables on
[reglens.info/methodology](https://www.reglens.info/methodology). Generating
rather than retyping is the point: a hand-copied rubric drifts from the code
within a release or two, and a drifted rubric is worse than none.

Regeneration currently needs access to that private repository, so these files
are refreshed by hand rather than by CI. Automating the push is open work.

## Caveats worth reading before relying on this

RUBRIC.md has a [Known gaps](RUBRIC.md#known-gaps) section, and it is not
decorative. In short: the 1–5 anchors are generic rather than per-dimension; the
rubric version tracks prompt changes rather than weight changes; and there is no
published calibration of passage likelihood against realized outcomes yet.

RegLens assessments are informational analysis, not investment, legal or tax
advice.

## Links

- [reglens.info](https://www.reglens.info)
- [Methodology, in prose](https://www.reglens.info/methodology)
- [System status](https://www.reglens.info/status)
