# Specs — enforceable rules (stolen from os-clovy `spec/index.md`)

Every spec is **Rule / Why / How to apply / Exceptions**. Read every spec in your scope before writing code; violations fail review.

| Spec | What it guards |
|---|---|
| [design-tokens](design-tokens.md) | Only variables from `src/styles/tokens.css` |
| [type-scale](type-scale.md) | Font sizes only from `--fs-*` |
| [sentence-case](sentence-case.md) | UI labels are sentence case, never SHOUTY |
| [no-all-caps](no-all-caps.md) | No `uppercase`, no `text-transform` |

When you add, rename, or remove a spec, update this index in the same commit.
