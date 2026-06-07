import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './send-email.js';
import { expiryWarning, archiveUpsell } from './email-templates.js';

const APP_URL = 'https://flash-app-gamma.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: events, error: fetchError } = await supabase
    .from('events')
    .select('id, host_id, name, expires_at')
    .lte('expires_at', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
    .gt('expires_at', new Date().toISOString())
    .is('expiry_notified_at', null);

  if (fetchError) {
    console.error('[cron-expiry-warn] Failed to fetch events:', fetchError.message);
    return res.status(200).json({ error: fetchError.message });
  }

  let processed = 0;
  let errors = 0;

  for (const event of events ?? []) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(event.host_id);
      if (userError || !user?.email) {
        console.error(`[cron-expiry-warn] Could not fetch host email for event ${event.id}`);
        errors++;
        continue;
      }

      const archiveUrl = APP_URL;

      await sendEmail({
        to: user.email,
        subject: `Your album disappears in 48 hours — ${event.name}`,
        html: expiryWarning({ eventName: event.name, expiresAt: event.expires_at, archiveUrl }),
      });

      const { data: archiveEntitlement } = await supabase
        .from('entitlements')
        .select('id')
        .eq('user_id', event.host_id)
        .eq('tier', 'archive')
        .limit(1)
        .maybeSingle();

      if (!archiveEntitlement) {
        await sendEmail({
          to: user.email,
          subject: 'Keep your album forever — €15/year',
          html: archiveUpsell({ eventName: event.name, archiveUrl }),
        });
      }

      const { error: updateError } = await supabase
        .from('events')
        .update({ expiry_notified_at: new Date().toISOString() })
        .eq('id', event.id);

      if (updateError) {
        console.error(`[cron-expiry-warn] Failed to mark event ${event.id}:`, updateError.message);
        errors++;
        continue;
      }

      console.log(`[cron-expiry-warn] Processed event ${event.id}`);
      processed++;
    } catch (err) {
      console.error(`[cron-expiry-warn] Unexpected error for event ${event.id}:`, err.message);
      errors++;
    }
  }

  const summary = { processed, errors };
  console.log('[cron-expiry-warn] Run complete.', JSON.stringify(summary));
  return res.status(200).json(summary);
}
