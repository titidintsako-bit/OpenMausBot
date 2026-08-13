# sentence-case

**Rule:** All UI labels are sentence case ("New session", "Knowledge", "Clear knowledge base"). Never SHOUTY CAPS, never Title Case For Buttons.

**Why:** `os-clovy/spec/sentence-case.md` — caps read as shouting to a firm partner. June enforces this; so does ComplyOS. Even `VAT201` stays `VAT201` (it's an acronym, not a label) but the *label* is "Prepare VAT201", not "PREPARE VAT201".

**Exceptions:** Acronyms (SARS, CIPC, VAT, PAYE, UIF), and code literals.

**Related:** `no-all-caps.md` bans `text-transform: uppercase` entirely.
