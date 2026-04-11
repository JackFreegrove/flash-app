You are auditing the Snapshot Co UI for quality and usability issues.

This is a premium wedding product. Guests use it on phones, often in low light, often one-handed, often while wearing formal clothes or holding a drink. The design must be elegant, fast, and completely frictionless.

Audit src/App.jsx for:

1. MOBILE UX — Touch targets under 44px, text under 14px, inputs that trigger zoom on iOS (font-size under 16px), anything requiring two hands
2. GUEST CAMERA FLOW — From QR scan to first photo should take under 30 seconds. Identify any friction points or unnecessary steps
3. VISUAL CONSISTENCY — Font usage, spacing, color usage should match the existing Cormorant Garamond / DM Mono / neutral palette system
4. LOADING STATES — Any action that takes time (upload, reveal) should have clear feedback. Identify missing loading states
5. ERROR STATES — What happens if camera fails, upload fails, network drops. Identify unhandled error states
6. ACCESSIBILITY — Missing alt text, unlabelled inputs, missing ARIA where needed

For each finding report: component name, severity (HIGH/MEDIUM/LOW), description, and specific recommended fix.

Do not suggest adding new libraries. Do not change the visual identity. Fix within the existing CSS and component structure.
