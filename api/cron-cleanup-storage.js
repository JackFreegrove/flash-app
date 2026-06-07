import { createClient } from '@supabase/supabase-js';

const STORAGE_BUCKET = 'photos';
const BATCH_SIZE = 100;

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
    .select('id, host_id')
    .lte('expires_at', new Date().toISOString())
    .eq('archived', false)
    .is('archive_expires_at', null)
    .eq('storage_cleaned', false);

  if (fetchError) {
    console.error('[cron-cleanup-storage] Failed to fetch events:', fetchError.message);
    return res.status(500).json({ error: fetchError.message });
  }

  let eventsProcessed = 0;
  let eventsSkipped = 0;
  let totalFilesDeleted = 0;
  let errors = 0;

  for (const event of events ?? []) {
    // Belt-and-suspenders: skip if host has an active archive entitlement,
    // guarding against a race where archived flag wasn't set yet.
    const { data: archiveEntitlement } = await supabase
      .from('entitlements')
      .select('id')
      .eq('user_id', event.host_id)
      .eq('tier', 'archive')
      .limit(1)
      .maybeSingle();

    if (archiveEntitlement) {
      console.log(`[cron-cleanup-storage] Skipping ${event.id} — archive entitlement found`);
      eventsSkipped++;
      continue;
    }

    const { data: objects, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(event.id);

    if (listError) {
      console.error(`[cron-cleanup-storage] List failed for ${event.id}:`, listError.message);
      errors++;
      continue;
    }

    const paths = (objects ?? []).map(obj => `${event.id}/${obj.name}`);
    let deleteOk = true;

    for (let i = 0; i < paths.length; i += BATCH_SIZE) {
      const batch = paths.slice(i, i + BATCH_SIZE);
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(batch);
      if (deleteError) {
        console.error(`[cron-cleanup-storage] Delete failed for ${event.id} (batch ${i / BATCH_SIZE + 1}):`, deleteError.message);
        errors++;
        deleteOk = false;
        break;
      }
      totalFilesDeleted += batch.length;
    }

    if (!deleteOk) continue;

    // Mark cleaned only after all deletes succeed (or folder was already empty).
    const { error: updateError } = await supabase
      .from('events')
      .update({ storage_cleaned: true })
      .eq('id', event.id);

    if (updateError) {
      console.error(`[cron-cleanup-storage] Mark-cleaned failed for ${event.id}:`, updateError.message);
      errors++;
      continue;
    }

    eventsProcessed++;
  }

  const summary = { eventsProcessed, eventsSkipped, totalFilesDeleted, errors };
  console.log('[cron-cleanup-storage] Run complete.', JSON.stringify(summary));
  return res.status(200).json(summary);
}
