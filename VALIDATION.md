# Validation

How RegLens's passage-likelihood calls are checked against what actually
happened — with the protocol published **before** the first resolved sample
exists, so the eventual rates cannot be accused of survivorship or of rules
tuned after the fact.

*A generated file: rendered from the same anonymous endpoint the site reads
(`get_public_validation`). Edit `scripts/render-validation.mjs`, not this
file — hand edits are overwritten on the next refresh.*

## What is measured

Every full bill analysis includes a passage likelihood — High, Medium, Low
or Very Low. Each night, every current call is joined to its bill's realized
outcome. The question this file answers is: **of the bills called High (or
Medium, or Low…) before their fate was sealed, what fraction were actually
enacted?**

## The rules, fixed in advance

- **Outcomes are classified conservatively.** A bill counts as enacted,
  vetoed, or dead only when its legislative record says so. Congress marks
  nothing "dead", so a federal bill that quietly stalls stays *unresolved*
  forever rather than being guessed dead; federal enactments are recognized
  only through the enacted-laws record.
- **Hindsight is excluded.** An analysis run on or after the day the outcome
  landed — or whose timing cannot be verified against an outcome date — is
  counted in its own visible column and never enters the rate.
- **Unresolved bills are not failures.** They are censored: out of the
  denominator until they resolve, however long that takes.
- **Latest call only.** A bill re-analyzed as it moves carries its most
  recent pre-outcome call, not its first. (First-call calibration becomes
  possible as the assessment history accumulates and is a stated future
  refinement.)

## The record

As of **2026-08-11** — the record began **2026-07-29**:

| Tier | Assessed | Unresolved | Excluded (hindsight / unverifiable) | Resolved sample | Enacted rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| High | 56 | 31 | 25 | 0 | — |
| Medium | 375 | 117 | 258 | 0 | — |
| Low | 29 | 29 | 0 | 0 | — |
| Very Low | 69 | 54 | 15 | 0 | — |

> **No prediction made before its bill's outcome has resolved yet.** The
> corpus was analyzed largely after import, so the outcomes already on the
> record are excluded as hindsight by the rules above. Rates appear here as
> live predictions resolve; the columns and exclusions are fixed now, before
> the first number exists.

## Read the numbers with these limits

- Only bills RegLens scored are in the pool, and only those that resolved
  enter a rate — which skews the early sample toward faster-moving bills.
- Judge every rate against its **Resolved sample** column. A rate over a
  handful of bills is an anecdote, not a calibration.
- A passage likelihood is a historical frequency claim, not a probability
  guarantee about any single bill.

## Cadence

The underlying record updates nightly. This file is refreshed quarterly
(January, April, July, October) by `.github/workflows/validation-refresh.yml`,
committing only when the record moved. The live, always-current version is on
[reglens.info/methodology](https://www.reglens.info/methodology).
