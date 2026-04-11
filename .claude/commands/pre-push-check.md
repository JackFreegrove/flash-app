Before I push to GitHub, do a pre-push check:

1. Check that no API keys, Stripe keys, or Supabase credentials appear anywhere in the changed files
2. Confirm .flash-overlay, flashing, and setFlashing have not been renamed
3. Confirm pricing values match CLAUDE.md (€59/€99/€169/€299/€15)
4. Confirm photos per guest match CLAUDE.md (Momento:5, Classic:5, Premium:8, VenuePartner:10)
5. Check the git diff and suggest a descriptive commit message

Report findings before I commit.
