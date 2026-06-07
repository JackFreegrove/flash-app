import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './send-email.js';
import { albumReveal, merchTeaser } from './email-templates.js';

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
    .select('id, host_id, name')
    .lte('reveal_time', new Date().toISOString())
    .is('reveal_notified_at', null);

  if (fetchError) {
    console.error('[cron-reveal-notify] Failed to fetch events:', fetchError.message);
    return res.status(200).json({ error: fetchError.message });
  }

  let processed = 0;
  let errors = 0;

  for (const event of events ?? []) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(event.host_id);
      if (userError || !user?.email) {
        console.error(`[cron-reveal-notify] Could not fetch host email for event ${event.id}`);
        errors++;
        continue;
      }

      const albumUrl = APP_URL;

      await sendEmail({
        to: user.email,
        subject: `Your album is ready — ${event.name}`,
        html: albumReveal({ eventName: event.name, albumUrl }),
      });

      await sendEmail({
        to: user.email,
        subject: 'Turn your photos into something permanent',
        html: merchTeaser({ eventName: event.name, albumUrl }),
      });

      const { error: updateError } = await supabase
        .from('events')
        .update({ reveal_notified_at: new Date().toISOString() })
        .eq('id', event.id);

      if (updateError) {
        console.error(`[cron-reveal-notify] Failed to mark event ${event.id}:`, updateError.message);
        errors++;
        continue;
      }

      console.log(`[cron-reveal-notify] Processed event ${event.id}`);
      processed++;
    } catch (err) {
      console.error(`[cron-reveal-notify] Unexpected error for event ${event.id}:`, err.message);
      errors++;
    }
  }

  const summary = { processed, errors };
  console.log('[cron-reveal-notify] Run complete.', JSON.stringify(summary));
  return res.status(200).json(summary);
}
