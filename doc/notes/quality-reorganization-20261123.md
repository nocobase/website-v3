# Quality documentation reorganization (2026-11-23)

Internal maintenance record. Not part of the published content or navigation.

## Sources

- Previous site version: `21551ba`, seven quality pages per language.
- Reference: [quality/overview.md](https://github.com/nocobase/studio/blob/d80afa435517ad595f09b42f07d26d6ebfaffb58/quality/overview.md) and [quality/solution.md](https://github.com/nocobase/studio/blob/d80afa435517ad595f09b42f07d26d6ebfaffb58/quality/solution.md).
- Diagram: [quality-flow.svg](https://github.com/nocobase/studio/blob/d80afa435517ad595f09b42f07d26d6ebfaffb58/quality/images/quality-flow.svg); English and Japanese versions translate the text only.

## Page structure

| Page | Contents |
| --- | --- |
| overview | Four key capabilities, test types, dimensions and tools, core scenarios, relation to PR checks |
| runs | Prerequisites, starting a test, how a test runs, progress, blockers, cancellation |
| reports | Delivery report and dimension conclusions, dimension reports, individual outcomes, acceptance, follow-ups, retesting, metric trends |
| standards | One metric per row with standard, tool, and method for each dimension; code quality judges new code only |
| settings | Triggers, scenario language, dimensions and Skills, project standards, core scenario maintenance |

Redirects: `metrics` → `standards`, `follow-ups` → `reports#follow-ups`, `scenarios` → `settings#scenarios`.

## Scope rules

Only decided behavior and standards are published. Left out on purpose: thresholds still marked XX in the reference (medium-severity counts, complexity > 15, unused exports, coverage, Lighthouse score, LCP, scenario coverage/pass/automation rates), planned dimensions (smoke, UX), partially implemented or unimplemented checks, and evaluated-but-unadopted tools.

## Screenshots

The nine existing CDN screenshots per language are kept unchanged; Chinese pages use Chinese screenshots, English and Japanese share the English ones. Inventory: quality-reorganization-20261123.json.
