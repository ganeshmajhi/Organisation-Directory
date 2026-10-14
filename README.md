# Organisation Directory

Angular 18+ standalone app for the Senior Front-End Developer take-home assessment.

## Requirements
- Node.js 20.11+ recommended
- npm

## Run locally
```bash
npm install
npm start
```
Open http://localhost:4200.

## Build
```bash
npm run build
```

## What's included
- Standalone Angular component, Signals for view state, `inject()` DI
- Typed reactive form with validation and case-insensitive name uniqueness
- Search and status filter reflected in URL query parameters
- Sort by name or created date
- Local fixture with approximately 140 records and intentionally messy data
- Simulated 400–900 ms list delay and ~15% random list failure
- Loading, error and empty states
- English translation JSON and CSS design tokens
- Visible status text alongside colour dot for accessibility

## Notes before submission
- Run and test the app locally, including the simulated failure path.
- Review remaining short template labels and accessibility strings and move them into `en.json` before a multi-language production release.
- Create meaningful Git commits as you work; do not upload a single unexplained snapshot.
- Deploy the app and record the requested 4–6 minute walkthrough in your own voice.
- Review `DECISIONS.md` and make sure you can explain every line.
