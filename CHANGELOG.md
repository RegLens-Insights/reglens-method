# Changelog

Every change to the rubric, so any published score can be attributed to the
version that produced it.

Scores are **not** retroactively recomputed when the rubric changes. An
assessment displays when it was generated; read it against the version current at
that time.

## Unreleased

Nothing pending.

## `2026-07-30.1` — current

The version in production, and the first to be published.

This entry documents the rubric as it stood when this repository was created
(2026-08-05); it is not a record of a change made on that date. The version
string is the analyzer's prompt version, which is what production stamps onto
each stored assessment.

- Five weighted bill dimensions — Operational 0.25, Compliance 0.20, Cost 0.20,
  Market Access 0.15, Timeline 0.20.
- Three weighted rule dimensions — Operational 0.40, Compliance 0.35, Cost 0.25.
- Tier ladder at 4.0 / 3.5 / 2.5, with High passage likelihood escalating from as
  low as 3.0 and Very Low passage capping the tier at Low.
- Dimension scores rounded to integers, clamped to 1–5, unparseable values
  failing safe to 1.

### Known limitation of this version string

It bumps when **prompt text** changes. A weight or threshold edited in the
analyzer's scoring module changes every subsequent score without bumping it, so
this version can understate what changed between two assessments. Giving the
rubric a version of its own is open work, tracked in
[RUBRIC.md](RUBRIC.md#known-gaps).

## Before publication

The rubric predates this repository. Earlier revisions were not versioned in a
way that can be reconstructed here, so no entries are claimed for them — an
assessment older than `2026-07-30.1` cannot be attributed to a specific published
rubric, and this document does not pretend otherwise.
