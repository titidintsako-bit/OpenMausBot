# type-scale

**Rule:** Font sizes only from `--fs-*`. Headings follow the mapping table.

| Token | Base | Use |
|---|---|---|
| `--fs-2xs` | 10px | timestamps, badges |
| `--fs-xs` | 11px | captions, meta |
| `--fs-sm` | 12px | secondary, muted |
| `--fs-md` | 13px | body, inputs |
| `--fs-lg` | 14px | titles, buttons |
| `--fs-xl` | 16px | section headings |
| `--fs-2xl` | 20px | page headings |
| `--fs-display` | 30px | hero: "What can Comply take off your plate?" |

Every `--fs-*` is `calc(base * var(--font-scale))` (`tokens.css:114`), so the Appearance text-size slider works by overriding one var on `<html>`.

**Why:** ComplyOS used 87 instances of `text-[14px]`. A 60-year-old accountant on 125% scale got nothing.

**Exceptions:** `font-size: 0` for icon-only buttons, and code blocks (`var(--font-mono)`).
