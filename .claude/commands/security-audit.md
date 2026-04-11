Run a security audit focused on the Snapshot Co pre-launch checklist:

1. Check api/create-checkout-session.js — is there a price ID whitelist?
2. Check for any hardcoded credentials anywhere in the codebase
3. Check for rate limiting on any API endpoints
4. Check that STRIPE_SECRET_KEY is only used server-side (never in VITE_ files)
5. List any input fields that lack validation

Report each finding with: file path, line number, severity (HIGH/MEDIUM/LOW), and recommended fix.
