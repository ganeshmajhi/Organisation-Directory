# Decisions — Organisation Directory

## Requirements and trade-offs
- **Conflict 1 (all records vs API limit):** chose to show all records in one table because this is a local fixture/mock API and the operations workflow values a single-page scan. In a real API with a 25-record request cap and 5 requests/minute limit, I would negotiate a bulk/export endpoint or add deliberate client-side batching with caching and rate-limit handling. I would not issue six requests immediately and risk throttling. This demo loads a 140-record fixture as one local asset.
- **Conflict 2 (dot-only status vs accessible status):** chose a coloured dot plus visible text label. Colour is supplemental, not the only signal.
- **Messy fixture:** normalize strings/status casing, trim names and strip directional formatting marks, map unknown status to `unknown`, reject negative/non-numeric member counts, handle missing owner email, invalid dates, string member counts, and duplicate IDs without assuming IDs are unique. The list uses `$index` as its tracking identity because duplicate IDs exist.
- **Sort:** name and created date can be toggled ascending/descending. Invalid dates sort consistently at the start in ascending order.
- **URL state:** query (`q`), status, sort key and direction are represented as query parameters so a filtered/sorted view can be shared. Search updates use replace navigation to avoid adding one history entry per keystroke; a debounce can be added if the URL update frequency becomes a concern.
- **Create validation:** typed reactive form with non-nullable controls where applicable; validation messages are displayed after blur/touch. Name uniqueness is case-insensitive and checked against the current in-memory list.
- **Persistence:** created records live in client state only; the assessment explicitly requires no backend.
- **Translations:** user-facing copy is centralized in `src/assets/en.json`. Some accessibility labels currently authored as short template literals should be moved into the translation file before a multi-language production release.
- **Design tokens:** palette, spacing, typography and radii are CSS custom properties in `src/styles.css`.

## AI tool declaration
- ChatGPT assisted with initial project scaffolding, fixture expansion, implementation drafts, and this decision log. I reviewed and should be able to explain and modify the submitted code. I will not claim the app has been tested in a browser until I run it locally.
