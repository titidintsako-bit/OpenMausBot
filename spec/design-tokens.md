# design-tokens

**Rule:** Use the variables in `src/styles/tokens.css`. No raw hex, no `text-[14px]`, no `bg-[#111]`, no `rounded-[6px]`.

**Why:** June's `tokens.css:269` tints every grey with `--brand-wash` so switching `sage → clay` retints the whole app. Raw values freeze the design — ComplyOS was stuck on `#070707` because of this.

**How to apply:**
- Colors: `var(--background)` / `var(--card)` / `var(--foreground)` / `var(--muted)` / `var(--border)` / `var(--primary)` — never `#...`
- Spacing: `var(--sp-3)` (8px) / `var(--sp-6)` (16px) — never `p-3` with magic numbers
- Radii: `var(--r-sm)` / `var(--r-lg)` — never `rounded-xl`
- Controls: `var(--control-md)` (28px) — see control-sizes in tokens
- Brand: `var(--brand)` — setting `--brand: #3f812f` tints everything via `color-mix(in oklch, ..., var(--brand-wash))`

**Exceptions:** `data:` URIs, third-party canvases, and the Maus SVG `fill` (those are art, not UI).
