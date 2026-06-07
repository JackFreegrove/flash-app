# Dormant Cron Jobs
These cron entries are ready to activate once Vercel Pro is active.
To enable: add both entries to the "crons" array in vercel.json and redeploy.

{ "path": "/api/cron-reveal-notify", "schedule": "0 * * * *" },
{ "path": "/api/cron-expiry-warn", "schedule": "0 * * * *" }
